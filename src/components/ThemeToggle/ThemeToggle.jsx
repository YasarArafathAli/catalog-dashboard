import React from 'react';
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import './theme-toggle.scss';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      className="theme-toggle"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    />
  );
};

export default ThemeToggle;
