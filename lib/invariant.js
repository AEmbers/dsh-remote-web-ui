//#region src/invariant.ts
const PACKAGE_NAME = "@linxin666/dsh-remote-web-ui";
/** Cordis companion plugin name. */
const name = "remote-web-ui-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: this package owns no durable package-local event
* stream; its route-table and device-session relationships are asserted by
* the package's own specs (route register/dispose symmetry via the
* webServer disposer contract, token/revocation semantics on the service).
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
