import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => Boolean(user && user.roles?.includes('admin'))
export const isAdminOrEditor: Access = ({ req: { user } }) =>
  Boolean(user && (user.roles?.includes('admin') || user.roles?.includes('editor')))
export const isAdminField: FieldAccess = ({ req: { user } }) =>
  Boolean(user && user.roles?.includes('admin'))