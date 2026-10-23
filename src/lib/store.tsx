import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { scoreCatch } from './points';
import { FRIEND_COMMENTS, REACTION_EMOJI, STATE_VERSION, buildSeedState } from './seed';
import type { AppNotification, AppState, Catch, Comment, User } from './types';
import { uid } from './util';

const STORAGE_KEY = 'wrangler:state:v1';

export type CatchDraft = Omit<Catch, 'id' | 'userId' | 'createdAt' | 'points' | 'reactions' | 'comments' | 'edited'>;

interface Store {
  ready: boolean;
  state: AppState;
  me: User | null;
  createProfile: (p: { name: string; handle: string; homeWater?: string }) => void;
  updateProfile: (p: Partial<Pick<User, 'name' | 'handle' | 'bio' | 'homeWater' | 'avatarColor'>>) => void;
  addCatch: (draft: CatchDraft) => Catch;
  updateCatch: (id: string, patch: Partial<CatchDraft>) => void;
  deleteCatch: (id: string) => void;
  toggleReaction: (catchId: string, emoji: string) => void;
  addComment: (catchId: string, text: string) => void;
  sendFriendRequest: (userId: string) => void;
  acceptRequest: (userId: string) => void;
  declineRequest: (userId: string) => void;
  removeFriend: (userId: string) => void;
  markNotificationsRead: () => void;
  setUnits: (units: AppState['settings']['units']) => void;
  resetAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

function rescore(c: Catch, all: Catch[]): Catch {
  const earlier = all.filter((x) => x.createdAt < c.createdAt);
  return {
    ...c,
    points: scoreCatch(
      {
        speciesId: c.speciesId,
        weightLb: c.weightLb,
        regionId: c.location.regionId,
        released: c.released,
        customTrophyLb: c.customTrophyLb,
        customRarity: c.customRarity,
      },
      earlier,
      c.userId,
      c.id,
    ),
  };
}

function differsFromAi(c: Pick<Catch, 'ai' | 'speciesId' | 'lengthIn' | 'weightLb'>): boolean {
  if (!c.ai || c.ai.source === 'demo') return false;
  return (
    c.ai.speciesId !== c.speciesId ||
    Math.abs(c.ai.lengthIn - c.lengthIn) > 0.05 ||
    Math.abs(c.ai.weightLb - c.weightLb) > 0.005
  );
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(buildSeedState);
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const saved = JSON.parse(raw) as AppState;
        if (saved.version === STATE_VERSION) setState(saved);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  // Persist after changes, batched.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
        console.warn('Wrangler: could not save data', e),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [state, ready]);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const notify = (s: AppState, n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppState => ({
    ...s,
    notifications: [{ ...n, id: uid('n'), createdAt: Date.now(), read: false }, ...s.notifications],
  });

  /** Friends react to (and sometimes comment on) a new catch. Simulated for the browser preview. */
  const simulateFriendResponses = useCallback(
    (catchId: string, bragged: boolean) => {
      {
        const friends = [...stateRef.current.friends].sort(() => Math.random() - 0.5);
        const count = Math.min(friends.length, bragged ? 4 : 2);
        friends.slice(0, count).forEach((fid, i) => {
          later(2500 + i * 2200 + Math.random() * 1500, () => {
            setState((cur) => {
              const c = cur.catches.find((x) => x.id === catchId);
              if (!c || !cur.friends.includes(fid)) return cur;
              const emoji = bragged && i === 0 ? '👑' : pick(REACTION_EMOJI);
              const withComment = i === 0 || (bragged && i === 2);
              const comment: Comment | null = withComment
                ? { id: uid('cm'), userId: fid, text: pick(FRIEND_COMMENTS), createdAt: Date.now() }
                : null;
              let next: AppState = {
                ...cur,
                catches: cur.catches.map((x) =>
                  x.id !== catchId
                    ? x
                    : {
                        ...x,
                        reactions: { ...x.reactions, [emoji]: [...(x.reactions[emoji] ?? []).filter((u) => u !== fid), fid] },
                        comments: comment ? [...x.comments, comment] : x.comments,
                      },
                ),
              };
              next = notify(next, {
                type: comment ? 'comment' : 'reaction',
                fromUserId: fid,
                catchId,
                text: comment ? `commented: “${comment.text}”` : `reacted ${emoji} to your ${c.speciesName}.`,
              });
              return next;
            });
          });
        });
      }
    },
    [later],
  );

  const me = state.meId ? state.users[state.meId] ?? null : null;

  const createProfile: Store['createProfile'] = useCallback(({ name, handle, homeWater }) => {
    const id = uid('me');
    const colors = ['#E1306C', '#F77737', '#5851DB', '#2F80ED', '#27AE60', '#9B51E0'];
    setState((s) => ({
      ...s,
      meId: id,
      users: {
        ...s.users,
        [id]: { id, name, handle: handle.replace(/^@/, ''), homeWater, avatarColor: pick(colors) },
      },
    }));
  }, []);

  const updateProfile: Store['updateProfile'] = useCallback((p) => {
    setState((s) => (s.meId ? { ...s, users: { ...s.users, [s.meId]: { ...s.users[s.meId], ...p } } } : s));
  }, []);

  const addCatch: Store['addCatch'] = useCallback(
    (draft) => {
      const base: Catch = {
        ...draft,
        id: uid('c'),
        userId: state.meId ?? 'me',
        createdAt: Date.now(),
        reactions: {},
        comments: [],
        edited: false,
        points: undefined as never,
      };
      base.edited = differsFromAi(base);
      const scored = rescore(base, state.catches);
      setState((s) => ({ ...s, catches: [scored, ...s.catches] }));
      simulateFriendResponses(scored.id, draft.notifiedFriends);
      return scored;
    },
    [state.meId, state.catches, simulateFriendResponses],
  );

  const updateCatch: Store['updateCatch'] = useCallback((id, patch) => {
    setState((s) => {
      const updated = s.catches.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...patch };
        return { ...merged, edited: c.edited || differsFromAi(merged) };
      });
      // A change can shift first-of-species / personal-best bonuses on later catches too.
      const mine = updated.find((c) => c.id === id)!;
      return {
        ...s,
        catches: updated.map((c) => (c.userId === mine.userId && c.createdAt >= mine.createdAt ? rescore(c, updated) : c)),
      };
    });
  }, []);

  const deleteCatch: Store['deleteCatch'] = useCallback((id) => {
    setState((s) => {
      const gone = s.catches.find((c) => c.id === id);
      const rest = s.catches.filter((c) => c.id !== id);
      return {
        ...s,
        catches: gone ? rest.map((c) => (c.userId === gone.userId && c.createdAt > gone.createdAt ? rescore(c, rest) : c)) : rest,
        notifications: s.notifications.filter((n) => n.catchId !== id),
      };
    });
  }, []);

  const toggleReaction: Store['toggleReaction'] = useCallback((catchId, emoji) => {
    setState((s) => {
      const meId = s.meId;
      if (!meId) return s;
      return {
        ...s,
        catches: s.catches.map((c) => {
          if (c.id !== catchId) return c;
          const list = c.reactions[emoji] ?? [];
          const has = list.includes(meId);
          return { ...c, reactions: { ...c.reactions, [emoji]: has ? list.filter((u) => u !== meId) : [...list, meId] } };
        }),
      };
    });
  }, []);

  const addComment: Store['addComment'] = useCallback((catchId, text) => {
    setState((s) => {
      if (!s.meId || !text.trim()) return s;
      const comment = { id: uid('cm'), userId: s.meId, text: text.trim(), createdAt: Date.now() };
      return { ...s, catches: s.catches.map((c) => (c.id === catchId ? { ...c, comments: [...c.comments, comment] } : c)) };
    });
  }, []);

  const sendFriendRequest: Store['sendFriendRequest'] = useCallback(
    (userId) => {
      setState((s) => ({ ...s, outgoingRequests: [...new Set([...s.outgoingRequests, userId])] }));
      // Demo friends accept after a few seconds.
      later(4000 + Math.random() * 3000, () => {
        setState((s) => {
          if (!s.outgoingRequests.includes(userId)) return s;
          return notify(
            {
              ...s,
              outgoingRequests: s.outgoingRequests.filter((u) => u !== userId),
              friends: [...new Set([...s.friends, userId])],
            },
            { type: 'friend_accept', fromUserId: userId, text: 'accepted your friend request.' },
          );
        });
      });
    },
    [later],
  );

  const acceptRequest: Store['acceptRequest'] = useCallback((userId) => {
    setState((s) => ({
      ...s,
      incomingRequests: s.incomingRequests.filter((u) => u !== userId),
      friends: [...new Set([...s.friends, userId])],
      notifications: s.notifications.filter((n) => !(n.type === 'friend_request' && n.fromUserId === userId)),
    }));
  }, []);

  const declineRequest: Store['declineRequest'] = useCallback((userId) => {
    setState((s) => ({
      ...s,
      incomingRequests: s.incomingRequests.filter((u) => u !== userId),
      notifications: s.notifications.filter((n) => !(n.type === 'friend_request' && n.fromUserId === userId)),
    }));
  }, []);

  const removeFriend: Store['removeFriend'] = useCallback((userId) => {
    setState((s) => ({ ...s, friends: s.friends.filter((u) => u !== userId) }));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setState((s) =>
      s.notifications.some((n) => !n.read) ? { ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) } : s,
    );
  }, []);

  const setUnits: Store['setUnits'] = useCallback((units) => {
    setState((s) => ({ ...s, settings: { ...s.settings, units } }));
  }, []);

  const resetAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState(buildSeedState());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      state,
      me,
      createProfile,
      updateProfile,
      addCatch,
      updateCatch,
      deleteCatch,
      toggleReaction,
      addComment,
      sendFriendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      markNotificationsRead,
      setUnits,
      resetAll,
    }),
    [ready, state, me, createProfile, updateProfile, addCatch, updateCatch, deleteCatch, toggleReaction, addComment,
      sendFriendRequest, acceptRequest, declineRequest, removeFriend, markNotificationsRead, setUnits, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
