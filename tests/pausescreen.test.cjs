const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('acorn');

const source = readFileSync(path.join(__dirname, '../Jellyfin.Plugin.PauseScreen/Resources/pausescreen.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function element() {
    const listeners = new Map();
    return {
        children: [],
        style: {},
        innerHTML: '',
        textContent: '',
        appendChild(child) { this.children.push(child); },
        addEventListener(name, listener) {
            if (!listeners.has(name)) listeners.set(name, new Set());
            listeners.get(name).add(listener);
        },
        removeEventListener(name, listener) { listeners.get(name).delete(listener); },
        dispatch(name) {
            for (const listener of listeners.get(name) || []) listener({ target: this });
        },
        listenerCount(name) { return (listeners.get(name) || new Set()).size; },
        paused: false,
        play() { this.paused = false; this.dispatch('play'); }
    };
}

function start({ item = { Id: 'episode', Type: 'Episode', Name: 'Episode' }, sessions,
    channels = { Items: [{ Id: 'channel', Name: 'Test Channel', Type: 'TvChannel' }] },
    programs = { Items: [] }, credentials = JSON.stringify({ Servers: [{ AccessToken: 'test-token', UserId: 'test-user' }] }),
    imageFailures = 0 } = {}) {
    const body = element();
    const video = element();
    const frames = [];
    const requests = [];
    const errors = [];
    const images = [];
    let activeVideo = video;
    const location = { origin: 'http://jellyfin.test', href: 'http://jellyfin.test/web/index.html' };
    const context = {
        document: { body, createElement: element, querySelector: () => activeVideo },
        location,
        window: { location },
        localStorage: { getItem: () => credentials },
        requestAnimationFrame: callback => frames.push(callback),
        setTimeout: () => 0,
        console: { warn: (...args) => errors.push(args), error: (...args) => errors.push(args) },
        Image: class {
            set src(url) {
                images.push(url);
                queueMicrotask(() => images.length <= imageFailures ? this.onerror() : this.onload());
            }
        },
        fetch: async (url, options) => {
            const pathname = new URL(url).pathname;
            requests.push({ pathname, headers: options.headers });
            let data;
            if (pathname === '/Sessions') data = sessions === undefined ? [{ NowPlayingItem: item }] : sessions;
            else if (pathname === '/LiveTv/Channels') data = channels;
            else if (pathname === '/LiveTv/Programs') data = programs;
            else if (pathname === `/Items/${item.Id}`) data = item;
            else throw new Error(`Unexpected request: ${url}`);
            return { ok: data !== null, json: async () => data };
        }
    };
    vm.runInNewContext(source, context, { filename: 'pausescreen.js' });
    const overlay = body.children[0];
    return {
        overlay, video, requests, errors, images, frames,
        get html() { return overlay.children[0].children[1].innerHTML; },
        async frame() {
            const pending = frames.splice(0);
            pending.forEach(callback => callback());
            await flush();
        },
        async pause() { activeVideo.paused = true; activeVideo.dispatch('pause'); await flush(); },
        replaceVideo() { activeVideo = element(); return activeVideo; }
    };
}

test('the entire embedded script parses as ES2017 (webOS 5.x/6.x)', () => {
    parse(source, { ecmaVersion: 2017, sourceType: 'script' });
});

test('pause/resume renders episode metadata, preserves zero indices and authenticates requests', async () => {
    const app = start({ item: {
        Id: 'episode', Type: 'Episode', Name: 'Special', SeriesName: 'Test Series',
        ParentIndexNumber: 0, IndexNumber: 0, SeasonNumber: 9, EpisodeNumber: 9,
        Taglines: ['Test synopsis']
    } });
    await app.frame();
    await app.pause();
    assert.equal(app.overlay.style.display, 'flex');
    assert.match(app.html, /Test Series/);
    assert.match(app.html, /S0E0/);
    assert.match(app.html, /Test synopsis/);
    for (const request of app.requests) {
        assert.equal(request.headers['X-Emby-Token'], 'test-token');
        assert.equal(request.headers['X-MediaBrowser-Token'], 'test-token');
        assert.match(request.headers.Authorization, /Token="test-token"/);
    }
    app.overlay.dispatch('click');
    assert.equal(app.video.paused, false);
    assert.equal(app.overlay.style.display, 'none');
    assert.deepEqual(app.errors, []);
});

test('null episode indices fall back and missing taglines do not throw', async () => {
    const app = start({ item: {
        Id: 'episode', Type: 'Episode', Name: 'Fallback', ParentIndexNumber: null,
        SeasonNumber: 2, EpisodeNumber: 3
    } });
    await app.frame();
    assert.match(app.html, /S2E3/);
    assert.deepEqual(app.errors, []);
});

test('Live TV preserves zero indices and description fallback', async () => {
    const app = start({ item: { Id: 'channel', Type: 'TvChannel' }, programs: { Items: [{
        Name: 'Special', SeriesName: 'Live Series', ParentIndexNumber: 0, IndexNumber: 0,
        SeasonNumber: 9, EpisodeNumber: 9, Description: 'Program description'
    }] } });
    await app.frame();
    await app.pause();
    assert.match(app.html, /Live Series/);
    assert.match(app.html, /S0E0/);
    assert.match(app.html, /Program description/);
    assert.deepEqual(app.errors, []);
});

test('Live TV falls back to alternate season and episode fields', async () => {
    const app = start({ item: { Id: 'channel', Type: 'TvChannel' }, programs: { Items: [{
        Name: 'Fallback', ParentIndexNumber: null, SeasonNumber: 2, EpisodeNumber: 3
    }] } });
    await app.frame();
    assert.match(app.html, /S2E3/);
    assert.deepEqual(app.errors, []);
});

for (const programs of [null, {}, { Items: null }, { Items: [] }]) {
    test(`Live TV tolerates missing program data: ${JSON.stringify(programs)}`, async () => {
        const app = start({ item: { Id: 'channel', Type: 'TvChannel' }, programs });
        await app.frame();
        assert.match(app.html, /Test Channel/);
        assert.deepEqual(app.errors, []);
    });
}

for (const channels of [null, {}, { Items: null }, { Items: [] }]) {
    test(`Live TV tolerates missing channels: ${JSON.stringify(channels)}`, async () => {
        const app = start({ item: { Id: 'channel', Type: 'TvChannel' }, channels });
        await app.frame();
        assert.equal(app.html, '');
        assert.deepEqual(app.errors, []);
    });
}

for (const sessions of [null, [], [{}]]) {
    test(`missing session hides the overlay without a request loop: ${JSON.stringify(sessions)}`, async () => {
        const app = start({ sessions });
        await app.frame();
        await app.pause();
        const count = app.requests.length;
        await app.frame();
        await app.frame();
        assert.equal(app.overlay.style.display, 'none');
        assert.equal(app.requests.length, count);
        assert.deepEqual(app.errors, []);
    });
}

test('switching video removes the previous listeners', async () => {
    const app = start();
    app.overlay.dispatch('click'); // No video has been detected yet.
    await app.frame();
    assert.equal(app.video.listenerCount('pause'), 1);
    const replacement = app.replaceVideo();
    await app.frame();
    assert.equal(app.video.listenerCount('pause'), 0);
    assert.equal(app.video.listenerCount('play'), 0);
    assert.equal(replacement.listenerCount('pause'), 1);
    assert.deepEqual(app.errors, []);
});

test('failed logo requests still fall back to the next image', async () => {
    const app = start({ imageFailures: 1 });
    await app.frame();
    assert.match(app.html, /Images\/Primary/);
    assert.equal(app.images.length, 2);
    assert.deepEqual(app.errors, []);
});

test('malformed credentials are caught without starting playback polling', () => {
    const app = start({ credentials: '{broken' });
    assert.equal(app.frames.length, 0);
    assert.equal(app.errors.length, 1);
    assert.equal(app.errors[0][0], 'Jellyfin credentials not found');
});
