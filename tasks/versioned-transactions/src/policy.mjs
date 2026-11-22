export function canRead(user, doc) {
  return !!user?.active && !!doc && (user.tenant === doc.tenant || doc.shares.includes(user.id));
}
export function canWrite(user, doc) {
  return (
    !!user?.active &&
    !!doc &&
    user.tenant === doc.tenant &&
    (user.role === 'admin' || (user.role === 'member' && doc.owner === user.id))
  );
}
