import { useEffect } from 'react';
import { App } from 'antd';
import { setMessageInstance } from '../../services/messageService';

/** Renders nothing — just wires the context-aware message instance into the singleton. */
export default function MessageProvider() {
  const { message } = App.useApp();
  useEffect(() => { setMessageInstance(message); }, [message]);
  return null;
}
