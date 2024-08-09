import { notification } from 'antd';

const Notification = ({ message, description, type }) => {
  return notification[type]({
    message,
    description,
  });
};

export default Notification;
