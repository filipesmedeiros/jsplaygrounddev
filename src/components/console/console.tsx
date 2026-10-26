import cn from 'classnames';
import { Console as ConsoleFeed, Hook, Decode, Encode } from 'console-feed';
import { type Message } from 'console-feed/lib/definitions/Component';
import { useState, useEffect, useRef } from 'react';

import Button from '../button';

import { ConsoleFeedGlobalVariables } from './constants';
import Prompt from './prompt';
import { type ConsoleMessageEventData } from './types';
import IFrame, { IFrameHandle } from '../iframe';
import { iframeGlueScriptConstructor } from './iframe-glue-script';

interface WebProps {
  className?: string;
  theme?: 'light' | 'dark';
  iframe?: HTMLIFrameElement | null;
}

const glue = iframeGlueScriptConstructor();

export function WebConsole({ className, theme = 'dark', iframe }: WebProps) {
  const [logs, setLogs] = useState<Message[]>([]);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (
      event: MessageEvent<Partial<ConsoleMessageEventData>>,
    ) => {
      if (event.origin === process.env.NEXT_PUBLIC_SITE_URL) {
        switch (event.data?.type) {
          case 'console:init': {
            setLogs([]);

            break;
          }
          case 'console:message': {
            const message = Decode(event.data.message) as Message;

            setLogs((logs) => [...logs, message]);

            break;
          }
        }
      }
    };

    window.addEventListener('message', listener);
    (window as any)[ConsoleFeedGlobalVariables.HOOK] = Hook;
    (window as any)[ConsoleFeedGlobalVariables.ENCODE] = Encode;

    return () => {
      window.removeEventListener('message', listener);
      delete (window as any)[ConsoleFeedGlobalVariables.HOOK];
      delete (window as any)[ConsoleFeedGlobalVariables.ENCODE];
    };
  }, [setLogs]);

  useEffect(() => {
    // Scroll to bottom
    consoleContainerRef.current!.scroll(
      0,
      consoleContainerRef.current!.scrollHeight,
    );
  }, [logs]);

  const submitPrompt = (command: string) => {
    iframe!.contentWindow!.postMessage(
      { type: 'console:command', command },
      process.env.NEXT_PUBLIC_SITE_URL!,
    );
  };

  return (
    <div className={cn(className, 'flex flex-col')}>
      <div className="px-2 flex justify-end">
        <Button
          className="m-1 rounded text-xs text-[#0076cf] hover:underline dark:text-[#2fafff]"
          onClick={() => setLogs([])}
        >
          Clear console
        </Button>
      </div>

      <div ref={consoleContainerRef} className="flex-one overflow-y-auto">
        <ConsoleFeed
          logs={logs}
          variant={theme}
          styles={{
            BASE_BACKGROUND_COLOR: 'inherit',
          }}
        />

        <Prompt onSubmit={submitPrompt} />
      </div>
    </div>
  );
}

interface TerminalProps {
  className?: string;
  theme?: 'light' | 'dark';
  js: string;
}

export function TerminalConsole({
  className,
  theme = 'dark',
  js,
}: TerminalProps) {
  const [logs, setLogs] = useState<Message[]>([]);

  const outputRef = useRef<IFrameHandle>(null);

  useEffect(() => {
    const listener = (
      event: MessageEvent<Partial<ConsoleMessageEventData>>,
    ) => {
      if (event.origin === process.env.NEXT_PUBLIC_SITE_URL) {
        switch (event.data?.type) {
          case 'console:init': {
            setLogs([]);

            break;
          }
          case 'console:message': {
            const message = Decode(event.data.message) as Message;

            setLogs((logs) => [...logs, message]);

            break;
          }
        }
      }
    };

    window.addEventListener('message', listener);
    (window as any)[ConsoleFeedGlobalVariables.HOOK] = Hook;
    (window as any)[ConsoleFeedGlobalVariables.ENCODE] = Encode;

    return () => {
      window.removeEventListener('message', listener);
      delete (window as any)[ConsoleFeedGlobalVariables.HOOK];
      delete (window as any)[ConsoleFeedGlobalVariables.ENCODE];
    };
  }, [setLogs]);

  useEffect(() => {
    outputRef.current!.reload({ html: '', css: '', js });
  }, [js]);

  return (
    <div className={cn(className, 'flex flex-col')}>
      <div className="px-2 flex justify-end">
        <Button
          className="m-1 rounded text-xs text-[#0076cf] hover:underline dark:text-[#2fafff]"
          onClick={() => setLogs([])}
        >
          Clear console
        </Button>
      </div>

      <div className="flex-one overflow-y-auto">
        <ConsoleFeed
          logs={logs}
          variant={theme}
          styles={{
            BASE_BACKGROUND_COLOR: 'inherit',
          }}
        />
      </div>

      <IFrame
        name="console-iframe"
        title="console-iframe"
        className="hidden"
        ref={outputRef}
        preScript={glue}
      />
    </div>
  );
}
