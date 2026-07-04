import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Type, Square, Maximize, Download, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const colorLabels = {
  primary: 'Primary (Gold)',
  secondary: 'Secondary (Bronze)',
  background: 'Background',
  dark: 'Dark / Text',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

const fontOptions = [
  'Inter',
  'Playfair Display',
  'Open Sans',
  'Roboto',
  'Montserrat',
  'Poppins',
  'Lora',
  'Merriweather',
];

export default function DesignSettings() {
  const { 
    designTheme, 
    updateDesignTheme, 
    applyPreset, 
    resetDesignTheme,
    exportTheme,
    importTheme,
    presetThemes 
  } = useTheme();
  
  const [localTheme, setLocalTheme] = useState(designTheme);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleColorChange = (colorKey, value) => {
    setLocalTheme({
      ...localTheme,
      colors: { ...localTheme.colors, [colorKey]: value }
    });
  };

  const handleFontChange = (fontType, value) => {
    setLocalTheme({
      ...localTheme,
      fonts: { ...localTheme.fonts, [fontType]: value }
    });
  };

  const handleSave = () => {
    updateDesignTheme(localTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreset = (presetName) => {
    const preset = presetThemes[presetName];
    if (preset) {
      setLocalTheme(preset);
      updateDesignTheme(preset);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(localTheme, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elysian-theme.json';
    a.click();
  };

  const handleImport = () => {
    if (importTheme(importJson)) {
      setLocalTheme(JSON.parse(importJson));
      setShowImport(false);
      setImportJson('');
    }
  };

  const handleReset = () => {
    resetDesignTheme();
    setLocalTheme(designTheme);
  };

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            Theme Presets
          </CardTitle>
          <CardDescription>Quick apply a pre-designed theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Classic Luxury */}
            <button
              onClick={() => handlePreset('classicLuxury')}
              className="group relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#C9A96E] transition-all"
            >
              <div className="flex gap-1 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#C9A96E]" />
                <div className="w-6 h-6 rounded-full bg-[#8B7355]" />
                <div className="w-6 h-6 rounded-full bg-[#0A0A0A]" />
              </div>
              <p className="font-medium text-left">Classic Luxury</p>
              <p className="text-xs text-gray-500 text-left">Gold & bronze elegance</p>
            </button>

            {/* Modern Minimal */}
            <button
              onClick={() => handlePreset('modernMinimal')}
              className="group relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-black transition-all"
            >
              <div className="flex gap-1 mb-3">
                <div className="w-6 h-6 rounded-full bg-black" />
                <div className="w-6 h-6 rounded-full bg-[#666666]" />
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300" />
              </div>
              <p className="font-medium text-left">Modern Minimal</p>
              <p className="text-xs text-gray-500 text-left">Clean & contemporary</p>
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => handlePreset('darkMode')}
              className="group relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#C9A96E] transition-all bg-[#0A0A0A]"
            >
              <div className="flex gap-1 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#C9A96E]" />
                <div className="w-6 h-6 rounded-full bg-[#B8A078]" />
                <div className="w-6 h-6 rounded-full bg-white" />
              </div>
              <p className="font-medium text-left text-white">Dark Mode</p>
              <p className="text-xs text-gray-400 text-left">Elegant dark theme</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Color Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[var(--color-primary)]" />
            Colors
          </CardTitle>
          <CardDescription>Customize your brand colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(localTheme.colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs">{colorLabels[key] || key}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <Input
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-[var(--color-primary)]" />
            Typography
          </CardTitle>
          <CardDescription>Choose your fonts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select value={localTheme.fonts.heading} onValueChange={(v) => handleFontChange('heading', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-2xl font-bold mt-2" style={{ fontFamily: localTheme.fonts.heading }}>
                Heading Preview
              </p>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select value={localTheme.fonts.body} onValueChange={(v) => handleFontChange('body', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2" style={{ fontFamily: localTheme.fonts.body }}>
                Body text preview with your selected font.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius & Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-[var(--color-primary)]" />
              Border Radius
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[localTheme.borderRadius]}
                onValueChange={([v]) => setLocalTheme({ ...localTheme, borderRadius: v })}
                max={20}
                step={1}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">0px (Sharp)</span>
                <span className="font-medium">{localTheme.borderRadius}px</span>
                <span className="text-sm text-gray-500">20px (Rounded)</span>
              </div>
              <div className="flex gap-4 mt-4">
                <div 
                  className="w-20 h-20 bg-[var(--color-primary)]"
                  style={{ borderRadius: localTheme.borderRadius }}
                />
                <div 
                  className="w-20 h-12 bg-gray-200 dark:bg-gray-700"
                  style={{ borderRadius: localTheme.borderRadius }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize className="h-5 w-5 text-[var(--color-primary)]" />
              Spacing Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['compact', 'normal', 'spacious'].map((spacing) => (
                <button
                  key={spacing}
                  onClick={() => setLocalTheme({ ...localTheme, spacing })}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    localTheme.spacing === spacing
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="font-medium capitalize">{spacing}</p>
                  <p className="text-xs text-gray-500">
                    {spacing === 'compact' && 'Tighter spacing for dense layouts'}
                    {spacing === 'normal' && 'Balanced spacing for most uses'}
                    {spacing === 'spacious' && 'More breathing room'}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: localTheme.colors.background,
              borderRadius: localTheme.borderRadius,
            }}
          >
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ 
                fontFamily: localTheme.fonts.heading,
                color: localTheme.colors.dark,
              }}
            >
              Umgora Collection
            </h2>
            <p 
              className="mb-4"
              style={{ 
                fontFamily: localTheme.fonts.body,
                color: localTheme.colors.secondary,
              }}
            >
              Discover our curated selection of premium fashion.
            </p>
            <div className="flex gap-3">
              <button
                className="px-6 py-2 font-medium text-white transition-transform hover:scale-[1.02]"
                style={{ 
                  backgroundColor: localTheme.colors.primary,
                  borderRadius: localTheme.borderRadius,
                }}
              >
                Shop Now
              </button>
              <button
                className="px-6 py-2 font-medium border transition-transform hover:scale-[1.02]"
                style={{ 
                  borderColor: localTheme.colors.dark,
                  color: localTheme.colors.dark,
                  borderRadius: localTheme.borderRadius,
                }}
              >
                Learn More
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <span 
                className="px-2 py-1 text-xs text-white"
                style={{ backgroundColor: localTheme.colors.success, borderRadius: localTheme.borderRadius / 2 }}
              >
                In Stock
              </span>
              <span 
                className="px-2 py-1 text-xs text-white"
                style={{ backgroundColor: localTheme.colors.warning, borderRadius: localTheme.borderRadius / 2 }}
              >
                Sale
              </span>
              <span 
                className="px-2 py-1 text-xs text-white"
                style={{ backgroundColor: localTheme.colors.error, borderRadius: localTheme.borderRadius / 2 }}
              >
                Low Stock
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export */}
      {showImport && (
        <Card>
          <CardHeader>
            <CardTitle>Import Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste theme JSON here..."
              rows={6}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleImport}>Import</Button>
              <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={() => setShowImport(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">
          {saved ? <Check className="h-4 w-4 mr-2" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}