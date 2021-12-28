import type { CredentialSet } from '../authentication/Credentials';
import type { CredentialsExtractor } from '../authentication/CredentialsExtractor';
import type { Authorizer } from '../authorization/Authorizer';
import type { PermissionReader } from '../authorization/PermissionReader';
import type { ModesExtractor } from '../authorization/permissions/ModesExtractor';
import { AccessMode } from '../authorization/permissions/Permissions';
import type { ResponseDescription } from '../http/output/response/ResponseDescription';
import { getLoggerFor } from '../logging/LogUtil';
import type { OperationHttpHandlerInput } from './OperationHttpHandler';
import { OperationHttpHandler } from './OperationHttpHandler';

export interface AuthorizingHttpHandlerArgs {
  /**
   * Extracts the credentials from the incoming request.
   */
  credentialsExtractor: CredentialsExtractor;
  /**
   * Extracts the required modes from the generated Operation.
   */
  modesExtractor: ModesExtractor;
  /**
   * Reads the permissions available for the Operation.
   */
  permissionReader: PermissionReader;
  /**
   * Verifies if the requested operation is allowed.
   */
  authorizer: Authorizer;
  /**
   * Handler to call if the operation is authorized.
   */
  operationHandler: OperationHttpHandler;
}

function parent(path: string): string {
  if (path == "http://localhost:3000/") {
    return "http://localhost:3000/";
  }
  const parts = path.split('/');
  if (parts[parts.length - 1 ] == '') {
    // http://localhost:3000/foo/bar/
    // ['http:', '', 'localhost:3000', 'foo', 'bar', ''] 
    // ['http:', '', 'localhost:3000', 'foo'] 
    // http://localhost:3000/foo/
    return parts.slice(0, parts.length - 2).join('/') + '/';
  } else {
    // http://localhost:3000/foo/bar
    // ['http:', '', 'localhost:3000', 'foo', 'bar'] 
    // ['http:', '', 'localhost:3000', 'foo'] 
    // http://localhost:3000/foo/
    return parts.slice(0, parts.length - 1).join('/') + '/';
  }
}

/**
 * Handles all the necessary steps for an authorization.
 * Errors if authorization fails, otherwise passes the parameter to the operationHandler handler.
 * The following steps are executed:
 *  - Extracting credentials from the request.
 *  - Extracting the required permissions.
 *  - Reading the allowed permissions for the credentials.
 *  - Validating if this operation is allowed.
 */
export class AuthorizingHttpHandler extends OperationHttpHandler {
  private readonly logger = getLoggerFor(this);

  private readonly credentialsExtractor: CredentialsExtractor;
  private readonly modesExtractor: ModesExtractor;
  private readonly permissionReader: PermissionReader;
  private readonly authorizer: Authorizer;
  private readonly operationHandler: OperationHttpHandler;

  public constructor(args: AuthorizingHttpHandlerArgs) {
    super();
    this.credentialsExtractor = args.credentialsExtractor;
    this.modesExtractor = args.modesExtractor;
    this.permissionReader = args.permissionReader;
    this.authorizer = args.authorizer;
    this.operationHandler = args.operationHandler;
  }

  private async doesntExist(path: string) {
    return false; // FIXME: actually check this
  }

  public async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription | undefined> {
    const { request, operation } = input;
    const credentials: CredentialSet = await this.credentialsExtractor.handleSafe(request);
    this.logger.verbose(`Extracted credentials: ${JSON.stringify(credentials)}`);
    const method = operation.method;
    let path = operation.target.path;
    const body = ''; // FIXME: get the request body here
    const basics: {[method: string]: Set<AccessMode>} = {
      HEAD: new Set([AccessMode.read]),
      GET: new Set([AccessMode.read]),
      PUT: new Set([AccessMode.append, AccessMode.write]),
      POST: new Set([AccessMode.append]),
      DELETE: new Set([AccessMode.write]),
      PATCH: ((body.indexOf('DELETE') == -1) ? new Set([AccessMode.append]) : new Set([AccessMode.append, AccessMode.write])),
    }
    let permissionSet = await this.permissionReader.handleSafe({ credentials, identifier: operation.target });
    let modes = basics[method];
    await this.authorizer.handleSafe({ credentials, identifier: operation.target, modes, permissionSet });
    if (['PUT', 'PATCH'].indexOf(method) !== -1) {
      // if the target resource doesn't exist, you need add on its direct container
      // if that container also doesn't exist yet, you need add access on its parent
      // etc
      while (await this.doesntExist(path)) {
        path = parent(path);
        permissionSet = await this.permissionReader.handleSafe({ credentials, identifier: { path } });
        await this.authorizer.handleSafe({
          credentials,
          identifier: { path },
          modes: new Set([AccessMode.append]),
          permissionSet
        });
      }
    }
    this.logger.verbose(`Authorization succeeded, calling source handler`);
    return this.operationHandler.handleSafe(input);
  }
}
