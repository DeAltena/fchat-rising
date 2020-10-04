import * as _ from 'lodash';

import core from '../chat/core';
import {Character as ComplexCharacter, CharacterGroup, Guestbook} from '../site/character_page/interfaces';
import { AsyncCache } from './async-cache';
import { Matcher, Scoring } from './matcher';
import { PermanentIndexedStore } from './store/sql-store';
import { CharacterImage, SimpleCharacter } from '../interfaces';


export interface MetaRecord {
    images: CharacterImage[] | null;
    groups: CharacterGroup[] | null;
    friends: SimpleCharacter[] | null;
    guestbook: Guestbook | null;
    lastMetaFetched: Date | null;
}


export interface CountRecord {
    groupCount: number | null;
    friendCount: number | null;
    guestbookCount: number | null;
    lastCounted: number | null;
}

export interface CharacterCacheRecord {
    character: ComplexCharacter;
    lastFetched: Date;
    added: Date;
    matchScore: number;
    // counts?: CountRecord;
    meta?: MetaRecord;
}

export class ProfileCache extends AsyncCache<CharacterCacheRecord> {
    protected store?: PermanentIndexedStore;

    protected lastFetch = Date.now();


    setStore(store: PermanentIndexedStore): void {
        this.store = store;
    }


    getSync(name: string): CharacterCacheRecord | null {
        const key = AsyncCache.nameKey(name);

        if (key in this.cache) {
            return this.cache[key];
        }

        return null;
    }


    async get(name: string, skipStore: boolean = false, fromChannel?: string): Promise<CharacterCacheRecord | null> {
        const key = AsyncCache.nameKey(name);

        if (key in this.cache) {
            return this.cache[key];
        }

        if ((!this.store) || (skipStore)) {
            return null;
        }

        if (false) {
            console.log(`Retrieve '${name}' for channel '${fromChannel}, gap: ${(Date.now() - this.lastFetch)}ms`);
            this.lastFetch = Date.now();
        }

        const pd = await this.store.getProfile(name);

        if (!pd) {
            return null;
        }

        const cacheRecord = await this.register(pd.profileData, true);

        cacheRecord.lastFetched = new Date(pd.lastFetched * 1000);
        cacheRecord.added = new Date(pd.firstSeen * 1000);

        cacheRecord.meta = {
            lastMetaFetched: pd.lastMetaFetched ? new Date(pd.lastMetaFetched) : null,
            groups: pd.groups,
            friends: pd.friends,
            images: pd.images,
            guestbook: pd.guestbook
        };

        /* cacheRecord.counts = {
            lastCounted: pd.lastCounted,
            groupCount: pd.groupCount,
            friendCount: pd.friendCount,
            guestbookCount: pd.guestbookCount
        }; */

        return cacheRecord;
    }


    // async registerCount(name: string, counts: CountRecord): Promise<void> {
    //     const record = await this.get(name);
    //
    //     if (!record) {
    //         // coward's way out
    //         return;
    //     }
    //
    //     record.counts = counts;
    //
    //     if (this.store) {
    //         await this.store.updateProfileCounts(name, counts.guestbookCount, counts.friendCount, counts.groupCount);
    //     }
    // }


    async registerMeta(name: string, meta: MetaRecord): Promise<void> {
        const record = await this.get(name);

        if (!record) {
            // coward's way out
            return;
        }

        record.meta = meta;

        if (this.store) {
            await this.store.updateProfileMeta(name, meta.images, meta.guestbook, meta.friends, meta.groups);
        }
    }


    async register(c: ComplexCharacter, skipStore: boolean = false): Promise<CharacterCacheRecord> {
        const k = AsyncCache.nameKey(c.character.name);
        const score = ProfileCache.score(c);

        if (score === 0) {
            console.log(`Storing score 0 for character ${c.character.name}`);
        }

        if ((this.store) && (!skipStore)) {
            await this.store.storeProfile(c);
        }

        if (k in this.cache) {
            const rExisting = this.cache[k];

            rExisting.character = c;
            rExisting.lastFetched = new Date();
            rExisting.matchScore = score;

            return rExisting;
        }

        const rNew = {
            character: c,
            lastFetched: new Date(),
            added: new Date(),
            matchScore: score
        };

        this.cache[k] = rNew;

        return rNew;
    }


    static score(c: ComplexCharacter): number {
        const you = core.characters.ownProfile;

        if (!you) {
            return 0;
        }

        const m = Matcher.identifyBestMatchReport(you.character, c.character);

        return m.score === null ? Scoring.NEUTRAL : m.score;
    }
}
