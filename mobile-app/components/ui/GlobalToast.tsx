import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Toast } from './Toast';
import { registerToastHandler, unregisterToastHandler } from '../../src/services/toastService';

export const GlobalToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success'|'error'|'info'>('info');
  const [duration, setDuration] = useState(4000);

  useEffect(() => {
    const h = ({ message, type = 'info', duration = 4000 }: { message: string; type?: 'success'| 'error'|'info'; duration?: number }) => {
      setMessage(message);
      setType(type);
      setDuration(duration);
      setVisible(true);
    };
    registerToastHandler(h);
    return () => unregisterToastHandler();
  }, []);

  return (
    <View pointerEvents="box-none">
      <Toast visible={visible} message={message} type={type} duration={duration} onHide={() => setVisible(false)} />
    </View>
  );
};
