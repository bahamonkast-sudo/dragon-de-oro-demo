import { useState, useEffect } from 'react';
import type { STPattern } from '../types';

import ss01 from '../../data/books/binary-options-bible/chapter-06/ss01.json';
import ss02 from '../../data/books/binary-options-bible/chapter-06/ss02.json';
import ss03 from '../../data/books/binary-options-bible/chapter-06/ss03.json';
import ss04 from '../../data/books/binary-options-bible/chapter-06/ss04.json';
import ss05 from '../../data/books/binary-options-bible/chapter-06/ss05.json';
import ss06 from '../../data/books/binary-options-bible/chapter-06/ss06.json';
import ss07 from '../../data/books/binary-options-bible/chapter-06/ss07.json';
import ss08 from '../../data/books/binary-options-bible/chapter-06/ss08.json';
import ss09 from '../../data/books/binary-options-bible/chapter-06/ss09.json';
import ss10 from '../../data/books/binary-options-bible/chapter-06/ss10.json';
import ss11 from '../../data/books/binary-options-bible/chapter-06/ss11.json';
import ss12 from '../../data/books/binary-options-bible/chapter-06/ss12.json';
import ss13 from '../../data/books/binary-options-bible/chapter-06/ss13.json';
import ss14 from '../../data/books/binary-options-bible/chapter-06/ss14.json';
import ss15 from '../../data/books/binary-options-bible/chapter-06/ss15.json';
import ss16 from '../../data/books/binary-options-bible/chapter-06/ss16.json';
import ss17 from '../../data/books/binary-options-bible/chapter-06/ss17.json';
import ss18 from '../../data/books/binary-options-bible/chapter-06/ss18.json';
import ss19 from '../../data/books/binary-options-bible/chapter-06/ss19.json';
import ss20 from '../../data/books/binary-options-bible/chapter-06/ss20.json';
import ss21 from '../../data/books/binary-options-bible/chapter-06/ss21.json';
import ss22 from '../../data/books/binary-options-bible/chapter-06/ss22.json';
import ss23 from '../../data/books/binary-options-bible/chapter-06/ss23.json';
import ss24 from '../../data/books/binary-options-bible/chapter-06/ss24.json';
import ss25 from '../../data/books/binary-options-bible/chapter-06/ss25.json';
import ss26 from '../../data/books/binary-options-bible/chapter-06/ss26.json';
import ss27 from '../../data/books/binary-options-bible/chapter-06/ss27.json';
import ss28 from '../../data/books/binary-options-bible/chapter-06/ss28.json';
import ss29 from '../../data/books/binary-options-bible/chapter-06/ss29.json';

export const patterns: STPattern[] = [
  ss01,
  ss02,
  ss03,
  ss04,
  ss05,
  ss06,
  ss07,
  ss08,
  ss09,
  ss10,
  ss11,
  ss12,
  ss13,
  ss14,
  ss15,
  ss16,
  ss17,
  ss18,
  ss19,
  ss20,
  ss21,
  ss22,
  ss23,
  ss24,
  ss25,
  ss26,
  ss27,
  ss28,
  ss29,
] as unknown as STPattern[];

const defaultPattern: STPattern = patterns[0] || ({} as STPattern);
let globalSelectedPattern: STPattern = defaultPattern;
let globalSearch: string = '';
const listeners = new Set<() => void>();

export const usePatterns = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleChange = () => setTick((t) => t + 1);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const selectPattern = (p: STPattern) => {
    globalSelectedPattern = p || defaultPattern;
    listeners.forEach((fn) => fn());
  };

  const setSearchQuery = (q: string) => {
    globalSearch = q;
    listeners.forEach((fn) => fn());
  };

  const filtered = patterns.filter((p) => {
    const q = globalSearch.toLowerCase();
    const nameMatch = p.name && p.name.toLowerCase().includes(q);
    const codeMatch = p.code && p.code.toLowerCase().includes(q);
    const idMatch = p.id && p.id.toLowerCase().includes(q);
    return nameMatch || codeMatch || idMatch;
  });

  return {
    patterns: globalSearch ? filtered : patterns,
    selectedPattern: globalSelectedPattern || defaultPattern,
    selectPattern,
    searchQuery: globalSearch,
    setSearchQuery,
  };
};

export default patterns;
