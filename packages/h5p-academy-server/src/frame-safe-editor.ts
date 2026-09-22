const integrationBootstrap =
    'window.H5PIntegration = parent.H5PIntegration ||';

const editorNamespaceBootstrap =
    'window.ns = window.H5PEditor = H5P.jQuery.extend(false, {}, window.parent.H5PEditor);';

const editorIntegrationBootstrap =
    'H5PIntegration = H5P.jQuery.extend(false, {}, window.parent.H5PIntegration);';

const htmlWidgetViewport =
    'const { innerHeight, innerWidth } = window.parent;';

export function makeEditorHtmlFrameSafe(html: string): string {
    return html.replace(
        integrationBootstrap,
        `let academyParentIntegration;
try {
    academyParentIntegration = window.parent.H5PIntegration;
} catch {
    academyParentIntegration = undefined;
}
window.H5PIntegration = academyParentIntegration ||`
    );
}

export function makeEditorClientFrameSafe(script: string): string {
    return script
        .replace(
            editorNamespaceBootstrap,
            `const academyParentValue = (key) => {
  try {
    return window.parent[key];
  }
  catch {
    return undefined;
  }
};
window.ns = window.H5PEditor = H5P.jQuery.extend(
  false,
  {},
  academyParentValue('H5PEditor') || window.H5PEditor
);`
        )
        .replace(
            editorIntegrationBootstrap,
            `H5PIntegration = H5P.jQuery.extend(
  false,
  {},
  academyParentValue('H5PIntegration') || window.H5PIntegration
);`
        );
}

export function makeHtmlWidgetFrameSafe(script: string): string {
    return script.replace(
        htmlWidgetViewport,
        `let academyViewport = window;
          try {
            academyViewport = window.parent;
            void academyViewport.innerHeight;
          }
          catch {
            academyViewport = window;
          }
          const { innerHeight, innerWidth } = academyViewport;`
    );
}
