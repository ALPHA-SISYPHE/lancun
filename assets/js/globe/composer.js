/**
 * Phase B post-processing composer stub.
 * Phase A renders earth RT + bubbles directly in GlobeScene.
 */
export function createGlobeComposer() {
  return {
    enabled: false,
    addPass() {},
    render() {},
    setSize() {},
    dispose() {},
  };
}
