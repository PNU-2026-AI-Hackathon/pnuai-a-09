import { supabase } from '@/src/lib/supabase';
import { Group, mockGroups } from '@/src/mocks/group';
import { mockUsers } from '@/src/mocks/users';
import type { AppUser } from '@/src/services/users';
import { mapUserRowToAppUser } from '@/src/services/users';

type GroupMemberRow = {
  user_id: string;
  profiles: {
    id: string;
    name: string;
    tag: string;
    profile_image_url: string | null;
    description: string | null;
    installed_at: string;
    intimacy_level: number;
  } | null;
};

type GroupRow = {
  id: string;
  name: string;
  group_members: GroupMemberRow[];
};

export type GroupWithMembers = Group & {
  members: AppUser[];
};

function fallbackGroupsWithMembers(): GroupWithMembers[] {
  return mockGroups.map((group) => ({
    ...group,
    members: mockUsers.filter((user) => group.memberIds.includes(user.id)),
  }));
}

export async function fetchGroupsWithMembers(): Promise<GroupWithMembers[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(
      `
      id,
      name,
      group_members (
        user_id,
        profiles (
          id,
          name,
          tag,
          profile_image_url,
          description,
          installed_at,
          intimacy_level
        )
      )
    `,
    )
    .order('created_at', { ascending: true })
    .returns<GroupRow[]>();

  if (error || !data) {
    console.warn('[groups] Falling back to mock groups', error);
    return fallbackGroupsWithMembers();
  }

  return data.map((group) => {
    const members = group.group_members
      .map((member) => member.profiles)
      .filter((user): user is NonNullable<GroupMemberRow['profiles']> => Boolean(user))
      .map(mapUserRowToAppUser);

    return {
      id: group.id,
      name: group.name,
      memberIds: members.map((member) => member.id),
      members,
    };
  });
}
