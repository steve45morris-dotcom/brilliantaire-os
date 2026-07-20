import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDesignSpec } from './DesignGuardian.js';

describe('Joy Beauty Studio pilot route', () => {
  it('has a valid project DESIGN.md and preserves the route contract', () => {
    const design = fs.readFileSync(path.resolve('docs/design/joy-beauty-studio/DESIGN.md'), 'utf8');
    expect(validateDesignSpec(design)).toMatchObject({ valid: true, missingSections: [] });
    const app = fs.readFileSync(path.resolve('dashboard/src/App.tsx'), 'utf8');
    expect(app).toContain("const isJoyBeautyStudioRoute = typeof window !== 'undefined' && window.location.pathname === '/projects/joy-beauty-studio'");
    expect(app).toContain('<JoyBeautyStudio />');
    expect(app.indexOf('if (isJoyBeautyStudioRoute) {\n    return <JoyBeautyStudio />;')).toBeLessThan(
      app.indexOf('if (loading) {'),
    );
    expect(app).toContain('if (isJoyBeautyStudioRoute) return;');
  });

  it('ships a focused responsive pilot component with real actions', () => {
    const component = fs.readFileSync(path.resolve('dashboard/src/components/JoyBeautyStudio.tsx'), 'utf8');
    const css = fs.readFileSync(path.resolve('dashboard/src/joy-beauty-studio.css'), 'utf8');
    expect(component).toContain('Book your visit');
    expect(component).toContain('setSelectedService');
    expect(component).toContain('joy-beauty-studio-hero.jpg');
    expect(component).toContain("document.title = 'Joy Beauty Studio | Personal beauty care'");
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).toContain(':focus-visible');
    expect(css).toMatch(/\.joy-brand[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.joy-nav-links a[^}]*min-height:\s*44px/s);
    expect(css).toContain('joy-nav-contrast');
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.joy-nav-contrast\s*\{\s*inset:\s*0 -20px;/);
  });
});
