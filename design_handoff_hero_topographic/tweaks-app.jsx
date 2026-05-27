// Tweaks panel for hero background — variants, density, warp, animation, theme.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "isolines",
  "density": 16,
  "warpRadius": 240,
  "warpStrength": 90,
  "speed": 1,
  "dark": true
}/*EDITMODE-END*/;

function HeroTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Sync theme attr -> tweak (allows external toggle button)
  React.useEffect(() => {
    const onTheme = (e) => {
      const isDark = e.detail === 'dark';
      if (isDark !== t.dark) setTweak('dark', isDark);
    };
    window.addEventListener('__themeChange', onTheme);
    return () => window.removeEventListener('__themeChange', onTheme);
  }, [t.dark]);

  // Apply to HeroBg + html
  React.useEffect(() => { HeroBg.setMode(t.variant); document.documentElement.dataset.mode = t.variant; }, [t.variant]);
  React.useEffect(() => { HeroBg.setOptions({ levels: t.density }); }, [t.density]);
  React.useEffect(() => { HeroBg.setOptions({ warpR: t.warpRadius }); }, [t.warpRadius]);
  React.useEffect(() => { HeroBg.setOptions({ warpA: t.warpStrength }); }, [t.warpStrength]);
  React.useEffect(() => { HeroBg.setOptions({ speed: t.speed }); }, [t.speed]);
  React.useEffect(() => {
    HeroBg.setTheme(t.dark);
    document.documentElement.dataset.theme = t.dark ? 'dark' : 'light';
  }, [t.dark]);

  // Density semantics differ between variants
  const densityLabel = t.variant === 'voronoi' ? 'Cellules' : 'Lignes';
  const densityMin = t.variant === 'voronoi' ? 40 : 6;
  const densityMax = t.variant === 'voronoi' ? 260 : 28;

  // For voronoi, density maps to point count
  React.useEffect(() => {
    if (t.variant === 'voronoi') HeroBg.setOptions({ voronoiCount: t.density });
  }, [t.variant, t.density]);

  // Adjust density when switching variant (use sensible defaults)
  const lastVar = React.useRef(t.variant);
  React.useEffect(() => {
    if (lastVar.current !== t.variant) {
      lastVar.current = t.variant;
      if (t.variant === 'voronoi' && t.density < 40) setTweak('density', 110);
      if (t.variant !== 'voronoi' && t.density > 28) setTweak('density', 16);
    }
  }, [t.variant]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Variante" />
      <TweakRadio
        label="Style"
        value={t.variant}
        options={[
          { value: 'isolines', label: 'Isolines' },
          { value: 'topographic', label: 'Relief' },
          { value: 'voronoi', label: 'Parcelles' },
        ]}
        onChange={(v) => setTweak('variant', v)}
      />

      <TweakSection label="Apparence" />
      <TweakSlider label={densityLabel} value={t.density} min={densityMin} max={densityMax} step={1}
        onChange={(v) => setTweak('density', v)} />
      <TweakToggle label="Thème sombre" value={t.dark}
        onChange={(v) => setTweak('dark', v)} />

      <TweakSection label="Interaction" />
      <TweakSlider label="Rayon curseur" value={t.warpRadius} min={0} max={500} step={10} unit="px"
        onChange={(v) => setTweak('warpRadius', v)} />
      <TweakSlider label="Force curseur" value={t.warpStrength} min={0} max={200} step={5}
        onChange={(v) => setTweak('warpStrength', v)} />

      <TweakSection label="Animation" />
      <TweakSlider label="Vitesse" value={t.speed} min={0} max={3} step={0.1}
        onChange={(v) => setTweak('speed', v)} />
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('tweaks-root'));
root.render(<HeroTweaks />);
