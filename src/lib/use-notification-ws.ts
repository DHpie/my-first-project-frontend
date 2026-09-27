'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Notification } from '@/types/notification';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'lost';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;

/**
 * 管理通知 WebSocket 连接，支持指数退避重连。
 * - 初始延迟 1s，每次翻倍，最大 30s，最多 3 次重试
 * - 重连成功后通过 onReconnected 回调通知组件拉取断线期间的通知
 */
export function useNotificationWs(
  token: string | null,
  onNotification: (notification: Notification) => void,
  onReconnected: () => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [retries, setRetries] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotificationRef = useRef(onNotification);
  const onReconnectedRef = useRef(onReconnected);
  const intentionalCloseRef = useRef(false);
  const wasDisconnectedRef = useRef(false);

  onNotificationRef.current = onNotification;
  onReconnectedRef.current = onReconnected;

  const connect = useCallback(() => {
    if (!token) return;

    // 使用 ws/wss 协议自适应
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      retryCountRef.current = 0;
      setRetries(0);
      // 从断线状态恢复时通知组件拉取 missed notifications
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        onReconnectedRef.current();
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 后端直接发送 NotificationResponse JSON，无包装
        if (data.id && data.type) {
          onNotificationRef.current(data as Notification);
        }
      } catch {
        // 忽略非 JSON 消息
      }
    };

    ws.onclose = () => {
      if (intentionalCloseRef.current) return;
      wasDisconnectedRef.current = true;
      attemptReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const attemptReconnect = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      setStatus('lost');
      return;
    }

    const delay = Math.min(INITIAL_DELAY * Math.pow(2, retryCountRef.current), MAX_DELAY);
    retryCountRef.current++;
    setRetries(retryCountRef.current);
    setStatus('reconnecting');

    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // 建立/断开连接
  useEffect(() => {
    if (!token) {
      setStatus('connecting');
      return;
    }

    intentionalCloseRef.current = false;
    wasDisconnectedRef.current = false;
    retryCountRef.current = 0;
    setRetries(0);
    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [token, connect]);

  const refresh = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    intentionalCloseRef.current = false;
    wasDisconnectedRef.current = false;
    retryCountRef.current = 0;
    setRetries(0);
    connect();
  }, [connect]);

  return { status, retries, refresh };
}
