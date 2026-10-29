// Takes the app core's theme (app-ui, one exact version) for this app, and never stops the app if the core is down.
// The same file sits in mo/, mo/guide/, babymo/ and qbank/ (tools/check.mjs compares them); tools/app-kit.mjs lists
// the version's files for the service workers. The NTF look comes from https://design.anantf.com/v1/tokens.css (linked
// first by each page); app.css still draws the screens, so the palette goes in the cascade layer `kit`, below it.
const CORE = 'https://core.anawj.com/ui/1.0.0-rc.35/';

export async function startKit() {
  try {
    const { applyTheme } = await import(CORE + 'theme/index.js');
    applyTheme({ accent: '#633d3c', surface: 'linen', look: 'a', layer: 'kit', ownTheme: true });
  } catch (e) {
    console.warn('app core theme not loaded', e);
  }
}

startKit();
