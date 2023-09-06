/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { warning } from '../utils/warning';

export const verify = (selector, methodName: string, displayName: string) => {
  if (!selector) {
    throw new Error(`Unexpected value for ${methodName} in ${displayName}.`);
  }

  if (methodName === 'mapStateToProps' || methodName === 'mapDispatchToProps') {
    // eslint-disable-next-line no-prototype-builtins
    if (!selector.hasOwnProperty('dependsOnOwnProps')) {
      warning(
        `The selector for ${methodName} of ${displayName} did not specify a value for dependsOnOwnProps.`,
      );
    }
  }
};

export const verifySubselectors = (
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  displayName,
) => {
  verify(mapStateToProps, 'mapStateToProps', displayName);
  verify(mapDispatchToProps, 'mapDispatchToProps', displayName);
  verify(mergeProps, 'mergeProps', displayName);
};
