const ledgerBrainEditorTheme = `<style data-ledgerbrain-h5p-theme>
:root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    --academy-blue: #245fd6;
    --academy-blue-hover: #1d4fc0;
    --academy-ink: #17191c;
    --academy-muted: #68707c;
    --academy-line: #dde1e7;
    --academy-surface: #ffffff;
    --academy-canvas: #f5f7fa;
}

* {
    box-sizing: border-box;
}

html,
body {
    max-width: none !important;
    min-height: 100%;
    margin: 0;
    color: var(--academy-ink);
    background: var(--academy-canvas);
    font-family: inherit !important;
    font-size: 14px;
}

body {
    padding: 16px 18px 28px;
}

#h5p-content-form {
    width: min(100%, 1120px);
    margin: 0 auto;
}

#post-body-content {
    overflow: hidden;
    border: 1px solid var(--academy-line);
    border-radius: 12px;
    background: var(--academy-surface);
    box-shadow: 0 8px 30px rgba(20, 29, 44, 0.06);
    animation: academy-editor-enter 180ms ease-out both;
}

.h5p-create,
.h5p-editor,
.h5peditor {
    width: 100%;
    font-family: inherit !important;
}

.h5peditor {
    font-size: 14px !important;
}

.h5peditor-form {
    padding: 16px !important;
}

.field {
    margin: 12px 0 !important;
    font-size: 14px !important;
}

.h5peditor .h5peditor-label,
.h5peditor .h5peditor-label-wrapper {
    color: var(--academy-ink);
    font-family: inherit !important;
}

.h5peditor .h5peditor-label {
    font-weight: 650;
}

.h5peditor .h5peditor-field-description,
.h5peditor .h5peditor-field-important-description {
    color: var(--academy-muted);
    font-size: 12px;
    line-height: 1.45;
}

.h5peditor textarea,
.h5peditor .h5peditor-text,
.h5peditor .ckeditor,
.h5peditor > select,
.h5peditor .h5peditor-language-switcher select,
.h5peditor h5peditor-select,
.h5peditor .field > select {
    border: 1px solid #cfd4dc !important;
    border-radius: 10px !important;
    background-color: #fff !important;
    box-shadow: none !important;
    color: var(--academy-ink);
    font-family: inherit !important;
    font-size: 14px !important;
    transition: border-color 140ms ease, box-shadow 140ms ease;
}

.h5peditor textarea:focus,
.h5peditor .h5peditor-text:focus,
.h5peditor select:focus {
    border-color: var(--academy-blue) !important;
    box-shadow: 0 0 0 3px rgba(36, 95, 214, 0.13) !important;
    outline: none;
}

button,
input[type="button"],
input[type="submit"],
.h5peditor-button,
.h5p-hub .h5p-hub-button,
.h5peditor-copy-button,
.h5peditor-paste-button {
    border-radius: 999px !important;
    font-family: inherit !important;
}

#save-h5p {
    position: sticky;
    bottom: 12px;
    z-index: 20;
    display: block;
    min-width: 108px;
    margin: 14px 0 0 auto;
    padding: 11px 18px;
    border: 0;
    border-radius: 999px;
    background: var(--academy-blue);
    box-shadow: 0 8px 20px rgba(36, 95, 214, 0.22);
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    transition: background-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

#save-h5p:hover {
    background: var(--academy-blue-hover);
    box-shadow: 0 10px 24px rgba(36, 95, 214, 0.28);
    transform: translateY(-1px);
}

#save-h5p:focus-visible,
button:focus-visible,
input[type="button"]:focus-visible,
input[type="submit"]:focus-visible {
    outline: 3px solid rgba(36, 95, 214, 0.24);
    outline-offset: 2px;
}

.group > .title,
.h5p-li > .list-item-title-bar,
.common > .h5peditor-label {
    border-color: var(--academy-line) !important;
    border-radius: 10px !important;
}

.group.expanded > .title,
.listgroup.expanded > .list-item-title-bar {
    border-radius: 10px 10px 0 0 !important;
}

.group > .content,
.content,
.common > .fields {
    border-color: var(--academy-line) !important;
    padding: 14px !important;
}

.group.expanded > .content,
.listgroup.expanded > .content,
.common > .fields {
    border-radius: 0 0 10px 10px;
}

.h5p-hub {
    color: var(--academy-ink);
    font-family: inherit !important;
}

.h5p-hub .h5p-hub-panel,
.h5p-hub .h5p-hub-container {
    border: 0;
    background: var(--academy-surface);
}

.h5p-hub-search-wrapper,
.h5p-hub .h5p-hub-filter-bar {
    padding: 10px 12px;
    background: #f0f3f7;
}

.h5p-hub-search-wrapper .h5p-hub-border-wrap {
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
}

.h5p-hub-search-bar,
.h5p-hub .h5p-hub-filter-search-bar {
    border: 1px solid #cfd4dc !important;
    border-radius: 999px !important;
    background: #fff;
    box-shadow: none !important;
    color: var(--academy-ink);
    font-family: inherit !important;
    font-style: normal;
}

.h5p-hub-content-selection-list {
    padding: 12px 8px 0;
}

.h5p-hub .h5p-hub-grid-item {
    margin: 4px;
    padding: 10px;
    border: 1px solid var(--academy-line);
    border-radius: 12px;
    background: #fff;
    transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.h5p-hub .h5p-hub-content-item.h5p-hub-grid:focus .h5p-hub-grid-item,
.h5p-hub .h5p-hub-content-item.h5p-hub-grid:hover .h5p-hub-grid-item {
    border-color: rgba(36, 95, 214, 0.42);
    background: #fff;
    box-shadow: 0 7px 20px rgba(20, 29, 44, 0.08);
    transform: translateY(-1px);
}

.h5p-hub .h5p-hub-grid-item img {
    border-radius: 8px;
    background: #f0f3f7;
}

.h5p-hub .h5p-hub-button.h5p-hub-button-primary {
    border-color: var(--academy-blue);
    background: var(--academy-blue);
}

.h5p-hub .h5p-hub-button.h5p-hub-button-primary:hover {
    border-color: var(--academy-blue-hover);
    background: var(--academy-blue-hover);
}

.h5peditor-form-manager-head {
    border-color: var(--academy-line);
    background: #f7f8fa;
    box-shadow: none;
}

.h5peditor-form-manager-proceed {
    border-radius: 999px;
    background: var(--academy-blue);
}

@keyframes academy-editor-enter {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 720px) {
    body {
        padding: 10px;
    }

    .h5peditor-form {
        padding: 12px !important;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
</style>`;

export function applyLedgerBrainEditorTheme(html: string): string {
    if (html.includes('</head>')) {
        return html.replace('</head>', `${ledgerBrainEditorTheme}\n</head>`);
    }
    return `${ledgerBrainEditorTheme}\n${html}`;
}
