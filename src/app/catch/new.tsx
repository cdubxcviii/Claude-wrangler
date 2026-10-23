import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatchForm, type CatchFormValue } from '../../components/CatchForm';
import { FishArt } from '../../components/FishArt';
import { Camera, ChevronLeft, ImageIcon, Info, MapPin, Pencil, Sparkles, X } from '../../components/icons';
import { Button, Card, Chip } from '../../components/ui';
import { AiError, aiMode, identifyFish } from '../../lib/ai';
import { fetchConditions } from '../../lib/conditions';
import { pickPhoto, type PickedPhoto } from '../../lib/image';
import { coordsFromExif, describeCoords, locateMe } from '../../lib/location';
import { isBragWorthy, scoreCatch } from '../../lib/points';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import type { AiEstimate, AiSource, CatchLocation, Conditions } from '../../lib/types';

type Step = 'pick' | 'analyzing' | 'review';

const EMPTY: CatchFormValue = {
  speciesId: '',
  speciesName: '',
  lengthIn: 0,
  weightLb: 0,
  location: null,
  secretSpot: false,
  released: false,
  caption: '',
  notifiedFriends: false,
};

const ANALYZE_STEPS = ['Looking for the fish…', 'Identifying species…', 'Measuring against hands and gear…', 'Estimating weight…', 'Checking how rare it is here…'];

export default function NewCatch() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, addCatch } = useStore();
  const [step, setStep] = useState<Step>('pick');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [ai, setAi] = useState<AiEstimate | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [mode, setMode] = useState<AiSource | null>(null);
  const [form, setForm] = useState<CatchFormValue>(EMPTY);
  const [locStatus, setLocStatus] = useState<'locating' | 'ok' | 'failed'>('locating');
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [pickErr, setPickErr] = useState<string | null>(null);
  const [analyzeIdx, setAnalyzeIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [scan] = useState(() => new Animated.Value(0));
  const locationRef = useRef<CatchLocation | null>(null);
  const [lastSpot] = useState<CatchLocation | null>(() => {
    const mine = state.catches.find((c) => c.userId === state.meId);
    return mine ? { ...mine.location, source: 'manual' } : null;
  });
  const lastSpotRef = useRef(lastSpot);

  useEffect(() => {
    aiMode().then(setMode);
    let alive = true;
    locateMe().then((r) => {
      if (!alive) return;
      if (r.ok) {
        locationRef.current = r.location;
        setForm((f) => (f.location ? f : { ...f, location: r.location }));
        setLocStatus('ok');
      } else {
        // No GPS (permission denied, or the browser preview): reuse the spot of your last catch.
        const last = lastSpotRef.current;
        if (last) {
          locationRef.current = last;
          setForm((f) => (f.location ? f : { ...f, location: last }));
        }
        setLocStatus('failed');
      }
    });
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  // Auto-log weather & moon whenever the location changes.
  const loc = form.location;
  useEffect(() => {
    if (!loc) return;
    let alive = true;
    fetchConditions(loc.lat, loc.lon).then((c) => alive && setConditions(c));
    return () => {
      alive = false;
    };
  }, [loc]);

  useEffect(() => {
    if (step !== 'analyzing') return;
    const loop = Animated.loop(Animated.timing(scan, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    const timer = setInterval(() => setAnalyzeIdx((i) => Math.min(i + 1, ANALYZE_STEPS.length - 1)), 2600);
    return () => {
      loop.stop();
      clearInterval(timer);
    };
  }, [step, scan]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const choose = async (from: 'camera' | 'library') => {
    setPickErr(null);
    try {
      const p = await pickPhoto(from);
      if (!p) return;
      setPhoto(p);
      // A photo's own GPS beats the phone's current position (you may be logging it later).
      const gps = coordsFromExif(p.exif);
      let location = form.location ?? locationRef.current;
      if (gps) location = await describeCoords(gps.lat, gps.lon, 'photo');
      if (location) setForm((f) => ({ ...f, location }));
      analyze(p, location ?? null);
    } catch (e: any) {
      setPickErr(e?.message ?? 'Could not open the camera.');
    }
  };

  const analyze = async (p: PickedPhoto, location: CatchLocation | null) => {
    setStep('analyzing');
    setAnalyzeIdx(0);
    setAiErr(null);
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const est = await identifyFish({ base64: p.base64, mimeType: p.mimeType, location, signal: ctl.signal });
      setAi(est);
      applyEstimate(est, location);
    } catch (e) {
      if (e instanceof AiError && e.code === 'cancelled') {
        setStep('pick');
        return;
      }
      setAiErr(e instanceof Error ? e.message : 'The AI could not analyze this photo.');
      setForm((f) => ({ ...f, location: f.location ?? location }));
    }
    setStep('review');
  };

  const applyEstimate = (est: AiEstimate, location: CatchLocation | null) => {
    setForm((f) => {
      const loc = f.location ?? location;
      const next: CatchFormValue = {
        ...f,
        speciesId: est.speciesId,
        speciesName: est.speciesName,
        customTrophyLb: est.speciesId === 'other' ? est.trophyWeightLb : undefined,
        customRarity: est.speciesId === 'other' ? est.regionalRarity : undefined,
        lengthIn: est.lengthIn,
        weightLb: est.weightLb,
        location: loc,
      };
      const p = scoreCatch(
        { speciesId: next.speciesId, weightLb: next.weightLb, regionId: loc?.regionId ?? 'intl', released: false, customTrophyLb: next.customTrophyLb, customRarity: next.customRarity },
        state.catches,
        state.meId ?? '',
      );
      return { ...next, notifiedFriends: isBragWorthy(p) };
    });
  };

  const manual = () => {
    setPhoto(null);
    setAi(null);
    setAiErr(null);
    setForm((f) => ({ ...f, location: f.location ?? locationRef.current }));
    setStep('review');
  };

  const canPost = !!form.speciesId && !!form.speciesName && form.weightLb > 0 && form.lengthIn > 0 && !!form.location;

  const post = () => {
    if (!canPost || !form.location) return;
    const c = addCatch({
      photo: photo?.dataUri,
      speciesId: form.speciesId,
      speciesName: form.speciesName,
      customTrophyLb: form.customTrophyLb,
      customRarity: form.customRarity,
      lengthIn: Math.round(form.lengthIn * 10) / 10,
      weightLb: Math.round(form.weightLb * 100) / 100,
      ai: ai ?? undefined,
      location: form.location,
      secretSpot: form.secretSpot,
      released: form.released,
      caption: form.caption.trim(),
      conditions: conditions ?? undefined,
      notifiedFriends: form.notifiedFriends,
    });
    router.replace({ pathname: '/catch/[id]', params: { id: c.id, celebrate: '1' } });
  };

  // ---------- Step 1: pick a photo ----------
  if (step === 'pick') {
    return (
      <View style={[styles.dark, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.darkHeader}>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
            <X size={28} color="#FFF" />
          </Pressable>
          <Text style={styles.darkTitle}>New catch</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.viewfinder}>
          <View style={styles.vfArt}>
            <FishArt speciesId="largemouth_bass" seed="vf" background={false} />
          </View>
          <Text style={styles.vfHint}>Lay the fish flat with your hand, rod or a ruler in frame.{'\n'}The AI uses them for scale.</Text>
          {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
            <View key={k} style={[styles.corner, cornerStyle[k]]} />
          ))}
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <MapPin size={13} color="#FFF" />
            <Text style={styles.statusText} numberOfLines={1}>
              {locStatus === 'locating'
                ? 'Finding your location…'
                : form.location
                  ? `${form.location.name}${locStatus === 'failed' ? ' (last spot)' : ''}`
                  : 'Location off. Set it after the photo.'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Sparkles size={13} color="#FFF" />
            <Text style={styles.statusText}>{mode === 'claude' ? 'Claude AI ready' : mode === 'server' ? 'AI server' : mode === 'demo' ? 'Demo AI' : 'AI…'}</Text>
          </View>
        </View>
        {pickErr && <Text style={styles.err}>{pickErr}</Text>}
        <View style={styles.pickButtons}>
          <Pressable onPress={() => choose('library')} style={styles.sideBtn} accessibilityLabel="Choose from library">
            <ImageIcon size={26} color="#FFF" />
            <Text style={styles.sideText}>Library</Text>
          </Pressable>
          <Pressable onPress={() => choose('camera')} style={styles.shutter} accessibilityLabel="Take photo">
            <View style={styles.shutterInner}>
              <Camera size={30} color="#111" />
            </View>
          </Pressable>
          <Pressable onPress={manual} style={styles.sideBtn} accessibilityLabel="Log without photo">
            <Pencil size={26} color="#FFF" />
            <Text style={styles.sideText}>No photo</Text>
          </Pressable>
        </View>
        {mode === 'demo' && (
          <Text style={styles.demoNote}>
            Demo AI makes up a plausible result. Open Wrangler from its Claude link, or run the AI server, for real identification.
          </Text>
        )}
      </View>
    );
  }

  // ---------- Step 2: analyzing ----------
  if (step === 'analyzing') {
    const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
    return (
      <View style={[styles.dark, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, justifyContent: 'center', gap: 24 }]}>
        <View style={styles.analyzeFrame}>
          {photo && <Image source={{ uri: photo.dataUri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={styles.darkTitle}>{mode === 'claude' ? 'Claude is studying your catch' : 'Analyzing your catch'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{ANALYZE_STEPS[analyzeIdx]}</Text>
          {mode === 'claude' && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', maxWidth: 300 }}>
              The first time, Claude asks you to allow this page to use it. A careful look can take up to a minute.
            </Text>
          )}
        </View>
        <Button title="Cancel" variant="secondary" onPress={() => abortRef.current?.abort()} style={{ alignSelf: 'center', minWidth: 140 }} />
      </View>
    );
  }

  // ---------- Step 3: review & post ----------
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.reviewHeader, { paddingTop: insets.top + 8, borderBottomColor: t.hairline }]}>
        <Pressable onPress={() => setStep('pick')} hitSlop={12} accessibilityLabel="Back">
          <ChevronLeft size={28} color={t.text} />
        </Pressable>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>Review catch</Text>
        <Pressable onPress={post} disabled={!canPost} hitSlop={12}>
          <Text style={{ color: canPost ? t.accent : t.textMuted, fontSize: 16, fontWeight: '700' }}>Post</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.reviewTop}>
          <View style={[styles.thumb, { backgroundColor: t.elevated }]}>
            {photo ? (
              <Image source={{ uri: photo.dataUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : form.speciesId ? (
              <FishArt speciesId={form.speciesId} seed="review" />
            ) : (
              <Camera size={28} color={t.textMuted} />
            )}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {ai ? (
              <>
                <View style={styles.aiHead}>
                  <Sparkles size={16} color={t.accent} />
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                    {ai.source === 'demo' ? 'Demo estimate' : 'AI estimate'} · {Math.round(ai.confidence * 100)}% sure
                  </Text>
                </View>
                <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>
                  {ai.notes ?? 'Check the numbers and fix anything that looks off.'}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{photo ? 'Enter the details' : 'Logging without a photo'}</Text>
                <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 18 }}>
                  {aiErr ?? 'Pick the species and enter the size. Catches without a photo still count.'}
                </Text>
                {aiErr && photo && (
                  <Pressable onPress={() => analyze(photo, form.location)}>
                    <Text style={{ color: t.accent, fontWeight: '700' }}>Try the AI again</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        {ai?.alternatives && ai.alternatives.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }}>Not right? It could also be</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ai.alternatives.map((a) => (
                <Chip
                  key={a.speciesName}
                  label={`${a.speciesName} ${Math.round(a.confidence * 100)}%`}
                  active={form.speciesName === a.speciesName}
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      speciesId: a.speciesId,
                      speciesName: a.speciesName,
                      customRarity: a.speciesId === 'other' ? 'uncommon' : undefined,
                      customTrophyLb: undefined,
                    }))
                  }
                />
              ))}
            </View>
          </View>
        )}

        <CatchForm value={form} onChange={setForm} conditions={conditions} />

        {ai?.funFact && (
          <Card>
            <View style={styles.aiHead}>
              <Info size={16} color={t.textMuted} />
              <Text style={{ color: t.text, fontWeight: '700' }}>Did you know?</Text>
            </View>
            <Text style={{ color: t.textMuted, marginTop: 6, lineHeight: 19 }}>{ai.funFact}</Text>
          </Card>
        )}

        {ai && ai.source !== 'demo' && form.speciesId && (ai.speciesId !== form.speciesId || Math.abs(ai.weightLb - form.weightLb) > 0.005 || Math.abs(ai.lengthIn - form.lengthIn) > 0.05) && (
          <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center' }}>
            You changed the AI’s numbers, so this catch will show an “Edited” tag.
          </Text>
        )}
        <Button title={canPost ? `Post catch · +${previewTotal(form, state)} pts` : 'Add species, size and location'} variant="gradient" onPress={post} disabled={!canPost} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function previewTotal(form: CatchFormValue, state: ReturnType<typeof useStore>['state']): number {
  if (!form.location) return 0;
  return scoreCatch(
    {
      speciesId: form.speciesId,
      weightLb: form.weightLb,
      regionId: form.location.regionId,
      released: form.released,
      customTrophyLb: form.customTrophyLb,
      customRarity: form.customRarity,
    },
    state.catches,
    state.meId ?? '',
  ).total;
}

const cornerStyle = {
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
};

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#0B0B0C', paddingHorizontal: 16 },
  darkHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  darkTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  viewfinder: {
    flex: 1,
    marginVertical: 16,
    borderRadius: 20,
    backgroundColor: '#17191C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
    maxHeight: 520,
  },
  vfArt: { width: '80%', aspectRatio: 1.6, opacity: 0.22 },
  vfHint: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: 'rgba(255,255,255,0.85)' },
  statusRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 260,
  },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  err: { color: '#FF8A8A', textAlign: 'center', marginTop: 10 },
  pickButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 22 },
  sideBtn: { alignItems: 'center', gap: 6, width: 80 },
  sideText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  shutter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  demoNote: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  analyzeFrame: { width: '100%', maxWidth: 420, aspectRatio: 1, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#17191C' },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 30, height: 3, backgroundColor: '#5BE0FF', shadowColor: '#5BE0FF', shadowOpacity: 1, shadowRadius: 12 },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  thumb: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
