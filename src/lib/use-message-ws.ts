'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { WebSocketMessagePayload } from '@/types/message';

interface UseMessageWsOptions {
  /** 收到消息时的回调 */
  onMessage: (payload: WebSocketMessagePayload) => void;
  /** 连接状态变化回调 */
  onStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  /** 是否启用连接（通常为登录后才启用） */
  enabled: boolean;
}

interface UseMessageWsReturn {
  /** 当前连接状态 */
  status: 'connected' | 'disconnected' | 'reconnecting';
  /** 手动重连 */
  reconnect: () => void;
}

/**
 * WebSocket Hook for 站内信实时推送。
 * 连接 /ws/messages 端点，接收新消息推送，支持断线自动重连。
 */
export function useMessageWs({
  onMessage,
  onStatusChange,
  enabled,
}: UseMessageWsOptions): UseMessageWsReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // 保持回调引用最新
  onMessageRef.current = onMessage;
  onStatusChangeRef.current = onStatusChange;

  const updateStatus = useCallback((newStatus: 'connected' | 'disconnected' | 'reconnecting') => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // 根据当前页面协议决定 ws/wss
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/messages`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      updateStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WebSocketMessagePayload;
        onMessageRef.current(payload);
      } catch {
        // 忽略无法解析的消息
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const scheduleReconnect = () => {
    // 最多重连 3 次
    if (reconnectAttemptsRef.current >= 3) {
      updateStatus('disconnected');
      return;
    }

    reconnectAttemptsRef.current += 1;
    updateStatus('reconnecting');

    // 指数退避：1s, 2s, 4s
    const delay = Math.pow(2, reconnectAttemptsRef.current - 1) * 1000;
    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    reconnectAttemptsRef.current = 0;
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    if (!enabled) {
      wsRef.current?.close();
      wsRef.current = null;
      updateStatus('disconnected');
      return;
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, connect, updateStatus]);

  return { status, reconnect };
}
