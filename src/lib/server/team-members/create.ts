import 'server-only';
import { randomUUID } from 'node:crypto';
import { MemberError, UncertainMemberWrite, type CreatedMember, type MemberInput } from './contracts';

export interface CreationDependencies {
  repository: {
    authorize(userId: string, input: MemberInput): Promise<void>;
    save(userId: string, member: CreatedMember, input: MemberInput): Promise<CreatedMember>;
    disableAffiliate(id: string): Promise<void>;
  };
  auth: { create(input: MemberInput): Promise<string>; remove(id: string): Promise<void> };
}
export async function createTeamMember(userId: string, input: MemberInput, { repository, auth }: CreationDependencies) {
  await repository.authorize(userId, input);
  const authId = await auth.create(input);
  const member: CreatedMember = { id: randomUUID(), userId: authId, email: input.email, name: input.name,
    username: input.username, role: input.role, isActive: true };
  try { return await repository.save(userId, member, input); }
  catch (error) {
    if (error instanceof UncertainMemberWrite) throw error;
    let cleanupFailed = false;
    if (input.role === 'AFFILIATOR') {
      try { await repository.disableAffiliate(member.id); } catch { cleanupFailed = true; }
    }
    try { await auth.remove(authId); } catch { cleanupFailed = true; }
    if (cleanupFailed) {
      console.error(`Team account reconciliation required for member ${member.id}, Auth user ${authId}.`);
      throw new MemberError(503, 'Account creation failed and cleanup needs administrator attention. Check the member list before retrying.');
    }
    throw error;
  }
}
