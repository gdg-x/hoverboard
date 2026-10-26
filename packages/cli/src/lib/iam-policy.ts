interface Binding {
  role: string;
  members?: string[];
  condition?: unknown;
}

export interface Policy {
  bindings?: Binding[];
  etag?: string;
  version?: number;
}

/** Adds `member` to `role` in `policy`. Returns false when it was already there. */
export const addMember = (policy: Policy, role: string, member: string): boolean => {
  const bindings = (policy.bindings ??= []);
  const binding = bindings.find((entry) => entry.role === role && !entry.condition);
  if (binding?.members?.includes(member)) return false;
  if (binding) {
    (binding.members ??= []).push(member);
  } else {
    bindings.push({ role, members: [member] });
  }
  return true;
};

/** Removes `member` from `role` in `policy`. Returns false when it wasn't there. */
export const removeMember = (policy: Policy, role: string, member: string): boolean => {
  const binding = policy.bindings?.find((entry) => entry.role === role && !entry.condition);
  if (!binding?.members?.includes(member)) return false;
  binding.members = binding.members.filter((entry) => entry !== member);
  if (!binding.members.length)
    policy.bindings = policy.bindings?.filter((entry) => entry !== binding);
  return true;
};
