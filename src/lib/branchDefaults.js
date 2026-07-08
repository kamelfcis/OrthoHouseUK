export const PUBLIC_BRANCH_CODE = 'UK'

export const getPublicBranch = (branches = []) =>
  branches.find((branch) => branch.branch_code === PUBLIC_BRANCH_CODE) ?? branches[0] ?? null

export const getPublicBranchId = (branches = []) =>
  getPublicBranch(branches)?.branch_id ?? null
