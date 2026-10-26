import { css as cmCSS } from '@codemirror/lang-css';
import { html as cmHTML } from '@codemirror/lang-html';
import { javascript as cmJS } from '@codemirror/lang-javascript';
import { useThrottle } from '@uidotdev/usehooks';

import cn from 'classnames';
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { AiOutlineSync } from 'react-icons/ai';
import { FiDownload, FiPlay } from 'react-icons/fi';

import Button from '../button';
import CodeMirrorWrapper from '../codemirror-wrapper';
import {
  WebConsole,
  TerminalConsole,
  iframeGlueScriptConstructor,
} from '../console';
import IFrame, { IFrameHandle } from '../iframe';
import ResizableDualPanel from '../resizable-dual-panel';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '../tabs';

import jsValidator from './js-validator';
import { exportContent as _exportContent } from './exportContent';

export interface REPLContext {
  theme: 'light' | 'dark';
  setTheme: (
    value: this['theme'] | ((previousValue: this['theme']) => this['theme']),
  ) => void;
  playground: 'js' | 'web';
  setPlayground: (value: this['playground']) => void;
  autoRun: boolean;
  setAutoRun: (value: boolean | ((previousValue: boolean) => boolean)) => void;
}

export const REPLContext = createContext<REPLContext | null>(null);

const playgrounds = {
  js: {
    left: {
      items: {
        html: false,
        css: false,
        js: true,
      },
      active: 'js',
    },
    right: {
      items: {
        output: false,
        console: true,
      },
      active: 'console',
    },
  },
  web: {
    left: {
      items: {
        html: true,
        css: true,
        js: true,
      },
      active: 'html',
    },
    right: {
      items: {
        output: true,
        console: true,
      },
      active: 'output',
    },
  },
};

type Playgrounds = typeof playgrounds;

const glue = iframeGlueScriptConstructor();

export default function REPL() {
  const { theme, playground, autoRun, setAutoRun } = useContext(REPLContext)!;
  const [tabs, dispatch] = useReducer(reducer, playgrounds[playground]);

  useEffect(() => {
    dispatch({
      type: 'CHANGE_PLAYGROUND',
      playground: playgrounds[playground],
    });
  }, [playground]);

  const outputRef = useRef<IFrameHandle>(null);

  const [html, setHTML] = useState<string>(localStorage.getItem('html') ?? '');
  const [css, setCSS] = useState<string>(localStorage.getItem('css') ?? '');
  const [webJs, setWebJS] = useState<string>(
    localStorage.getItem('webjs') ?? '',
  );
  const [js, setJS] = useState<string>(localStorage.getItem('js') ?? '');

  const delayHTML = useThrottle(html, 500);
  const delayCSS = useThrottle(css, 500);
  const delayWebJS = useThrottle(webJs, 500);
  const delayJS = useThrottle(js, 500);

  useEffect(() => {
    localStorage.setItem('html', delayHTML);
  }, [delayHTML]);
  useEffect(() => {
    localStorage.setItem('css', delayCSS);
  }, [delayCSS]);
  useEffect(() => {
    localStorage.setItem('webjs', delayWebJS);
  }, [delayWebJS]);
  useEffect(() => {
    localStorage.setItem('js', delayJS);
  }, [delayJS]);

  const exportContent = useCallback(() => {
    _exportContent({
      html,
      css,
      js: jsValidator(js),
      webJs: jsValidator(webJs),
    });
  }, [html, css, js, webJs]);

  const reloadIframe = useCallback(() => {
    outputRef.current?.reload({
      html,
      css,
      js: jsValidator(webJs),
    });
  }, [outputRef.current, html, css, webJs]);

  return (
    <div className="bg-[#ffffff] flex flex-col dark:bg-[#161b22] w-full h-full">
      <ResizableDualPanel
        className="flex-one max-sm:flex-col"
        sliderPositionFraction={0.5}
        left={
          <Tabs
            activeTab={tabs.left.active}
            onTabClick={(id) =>
              dispatch({ type: 'ACTIVATE_TAB', group: 'left', id })
            }
          >
            <TabList
              className="border-b border-[#cccccc] dark:border-[#30363d]"
              right={
                <>
                  <Button
                    title="Export"
                    as={FiDownload}
                    className="text-xl text-[#0076cf] dark:text-[#2fafff]"
                    onClick={exportContent}
                  />
                  {/*{playground === 'js' && (
                    <Button
                      title={autoRun ? 'Disable auto-run' : 'Enable auto-run'}
                      as={AiOutlineSync}
                      className={cn('text-xl', {
                        'text-[#0076cf] dark:text-[#2fafff]': autoRun,
                        'text-[#a1a1a1] dark:text-[#7d8590]': !autoRun,
                      })}
                      onClick={() => setAutoRun((value) => !value)}
                    />
                  )}*/}
                  <Button
                    title={autoRun ? 'Re-run' : 'Run'}
                    as={FiPlay}
                    className="text-xl text-[#0076cf] dark:text-[#2fafff]"
                    onClick={reloadIframe}
                  />
                </>
              }
            >
              <Tab id="html" hidden={!tabs.left.items.html}>
                HTML
              </Tab>
              <Tab id="css" hidden={!tabs.left.items.css}>
                CSS
              </Tab>
              <Tab id="js" hidden={!tabs.left.items.js}>
                JavaScript
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel id="html">
                <CodeMirrorWrapper
                  className="flex-one w-full"
                  theme={theme}
                  extensions={[cmHTML()]}
                  value={html}
                  onChange={setHTML}
                />
              </TabPanel>
              <TabPanel id="css">
                <CodeMirrorWrapper
                  className="flex-one w-full"
                  theme={theme}
                  extensions={[cmCSS()]}
                  value={css}
                  onChange={setCSS}
                />
              </TabPanel>
              <TabPanel id="js">
                <CodeMirrorWrapper
                  className="flex-one w-full"
                  theme={theme}
                  value={playground === 'web' ? webJs : js}
                  extensions={[cmJS()]}
                  onChange={(value) =>
                    playground === 'web' ? setWebJS(value) : setJS(value)
                  }
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        }
        right={
          <Tabs
            activeTab={tabs.right.active}
            onTabClick={(id) =>
              dispatch({ type: 'ACTIVATE_TAB', group: 'right', id })
            }
          >
            <TabList
              className={cn(
                'border-b border-[#cccccc] dark:border-[#30363d] max-sm:border-t',
              )}
            >
              <Tab id="output" hidden={!tabs.right.items.output}>
                Output
              </Tab>
              <Tab id="console" hidden={!tabs.right.items.console}>
                Console
              </Tab>
            </TabList>
            {playground === 'js' ? (
              <TabPanels>
                <></>
                <TabPanel id="console">
                  <TerminalConsole className="flex-one" theme={theme} js={js} />
                </TabPanel>
              </TabPanels>
            ) : (
              <TabPanels>
                <TabPanel id="output">
                  <IFrame
                    ref={outputRef}
                    name="output"
                    width="100%"
                    title="Output"
                    preScript={glue}
                  />
                </TabPanel>
                <TabPanel id="console">
                  <WebConsole
                    className="flex-one"
                    theme={theme}
                    iframe={outputRef.current?.element}
                  />
                </TabPanel>
              </TabPanels>
            )}
          </Tabs>
        }
      />
    </div>
  );
}

function reducer<T extends Playgrounds['js'] | Playgrounds['web']>(
  state: T,
  action:
    | { type: 'CHANGE_PLAYGROUND'; playground: T }
    | { type: 'ACTIVATE_TAB'; group: 'left' | 'right'; id: string },
) {
  switch (action.type) {
    case 'CHANGE_PLAYGROUND': {
      return action.playground;
    }
    case 'ACTIVATE_TAB': {
      return {
        ...state,
        [action.group]: { ...state[action.group], active: action.id },
      };
    }
    default: {
      return state;
    }
  }
}
