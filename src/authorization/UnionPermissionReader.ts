import type { CredentialGroup } from '../authentication/Credentials';
import { UnionHandler } from '../util/handlers/UnionHandler';
import type { PermissionReader, PermissionReaderOutput } from './PermissionReader';
import type { Permission, PermissionSet } from './permissions/Permissions';

/**
 * Combines the results of multiple PermissionReaders.
 * Every permission in every credential type is handled according to the rule `false` \> `true` \> `undefined`.
 */
export class UnionPermissionReader extends UnionHandler<PermissionReader> {
  public constructor(readers: PermissionReader[]) {
    super(readers);
  }

  protected async combine(results: PermissionReaderOutput[]): Promise<PermissionReaderOutput> {
    const result: PermissionSet = {};
    let ancestors;
    for (const permissionSet of results) {
      for (const [ key, value ] of Object.entries(permissionSet.permissions) as [ CredentialGroup, Permission | undefined ][]) {
        result[key] = this.applyPermissions(value, result[key]);
        if (permissionSet.ancestors) {
          ancestors = permissionSet.ancestors;
        }
      }
    }
    return { permissions: result, ancestors };
  }

  /**
   * Adds the given permissions to the result object according to the combination rules of the class.
   */
  private applyPermissions(permissions?: Permission, result: Permission = {}): Permission {
    if (!permissions) {
      return result;
    }

    for (const [ key, value ] of Object.entries(permissions) as [ keyof Permission, boolean | undefined ][]) {
      if (typeof value !== 'undefined' && result[key] !== false) {
        result[key] = value;
      }
    }
    return result;
  }
}
