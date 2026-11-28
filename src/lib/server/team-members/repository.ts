import 'server-only';
import { randomUUID } from 'node:crypto';
import { database, transaction } from './database';
import { MemberError, UncertainMemberWrite, requireCreationAccess, type Actor, type CreatedMember, type MemberInput } from './contracts';

const memberColumns = 'id,user_id AS "userId",email,username,name,role,is_active AS "isActive"';
export const memberRepository = {
  async authorize(userId: string, input: MemberInput) {
    const db = database('team');
    const { rows } = await db.query<Actor>('SELECT id,role,is_active AS "isActive" FROM public.team_members WHERE user_id=$1', [userId]);
    requireCreationAccess(rows[0], input.role);
    const duplicate = await db.query('SELECT id FROM public.team_members WHERE lower(email)=$1 OR username=$2 LIMIT 1', [input.email, input.username]);
    if (duplicate.rowCount) throw new MemberError(409, 'A Team member with this email or username already exists.');
    if (input.role === 'AFFILIATOR') database('main');
  },
  async save(userId: string, member: CreatedMember, input: MemberInput) {
    const db = database('team');
    try {
      return await transaction(db, async tx => {
        const actor = await tx.query<Actor>('SELECT id,role,is_active AS "isActive" FROM public.team_members WHERE user_id=$1 FOR SHARE', [userId]);
        requireCreationAccess(actor.rows[0], input.role);
        const created = await tx.query<CreatedMember>(`INSERT INTO public.team_members
          (id,user_id,email,username,name,role,is_active,updated_at) VALUES ($1,$2,$3,$4,$5,$6,true,NOW()) RETURNING ${memberColumns}`,
        [member.id, member.userId, member.email, member.username, member.name, member.role]);
        await tx.query(`INSERT INTO public.activity_logs
          (id,actor_team_member_id,event_type,entity_type,entity_id,metadata)
          VALUES ($1,$2,'TEAM_MEMBER_CREATED','TEAM_MEMBER',$3,$4::jsonb)`,
        [randomUUID(), actor.rows[0].id, member.id, JSON.stringify({ email: member.email, role: member.role })]);
        if (member.role === 'AFFILIATOR') await syncAffiliate(member);
        return created.rows[0];
      });
    } catch (error) {
      // Distinguish a rolled-back write from an acknowledged-lost COMMIT.
      let committed: CreatedMember | undefined;
      try { committed = (await db.query<CreatedMember>(`SELECT ${memberColumns} FROM public.team_members WHERE id=$1`, [member.id])).rows[0]; }
      catch { throw new UncertainMemberWrite(); }
      if (committed) return committed;
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        throw new MemberError(409, 'A Team member with this email or username already exists.');
      }
      throw error;
    }
  },
  async disableAffiliate(id: string) {
    await database('main').query('UPDATE "AffiliateProfile" SET "isActive"=false WHERE id=$1', [id]);
  },
};
async function syncAffiliate(member: CreatedMember) {
  await transaction(database('main'), async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,721562702))', [member.id]);
    await tx.query(`INSERT INTO "AffiliateProfile" (id,"userId",name,identifier,"isActive") VALUES ($1,$2,$3,$4,true)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,identifier=EXCLUDED.identifier,"isActive"=true`,
    [member.id, member.userId, member.name, member.email]);
    await tx.query(`INSERT INTO "AffiliateTerms" (id,"affiliateId",config,"effectiveAt")
      SELECT $1,$2,config,CURRENT_TIMESTAMP FROM "AffiliateDefaults" WHERE id='default'
      AND NOT EXISTS (SELECT 1 FROM "AffiliateTerms" WHERE "affiliateId"=$2)`, [randomUUID(), member.id]);
    const terms = await tx.query('SELECT id FROM "AffiliateTerms" WHERE "affiliateId"=$1 LIMIT 1', [member.id]);
    if (!terms.rowCount) throw new MemberError(503, 'Affiliate defaults must be configured before creating an affiliate.');
  });
}
