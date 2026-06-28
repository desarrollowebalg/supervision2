export const SUPERVISION_DETAIL_REGISTRY = {
  'incidents-list': 'incidents-list'
};

export function hasRegisteredSupervisionDetail(detailSlot) {
  return Object.hasOwn(SUPERVISION_DETAIL_REGISTRY, detailSlot);
}
