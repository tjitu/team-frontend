'use client';

import { useParams } from 'next/navigation';
import { ActivityFeed } from '@/components/activity-feed';

export default function ProjectActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return <ActivityFeed scope="project" projectId={projectId} />;
}
