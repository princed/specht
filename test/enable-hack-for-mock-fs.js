/* eslint no-param-reassign:0 import/no-extraneous-dependencies:0 */
import fs from 'graceful-fs';

export default function enableHackForMockFs(mockFs) {
  const restoreList = [];

  Object.keys(mockFs).forEach((key) => {
    if (!/._OK/.test(key)) {
      const realMethod = fs[key];
      const mockMethod = mockFs[key];

      restoreList.push(() => {
        fs[key] = realMethod;
      });

      fs[key] = mockMethod;
    }
  });

  return function restoreFn() {
    restoreList.forEach((cb) => cb());
  };
}
