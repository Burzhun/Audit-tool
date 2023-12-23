import React from 'react';
import Resizable from './Resizable';

const __rest = (this && this.__rest) || function (s, e) {
  const t = {};
  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) { t[p] = s[p]; }
  }
  if (s != null && typeof Object.getOwnPropertySymbols === 'function') {
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) { t[p[i]] = s[p[i]]; }
    }
  }
  return t;
};
// An example use of Resizable.
export default class ResizableBox extends React.Component {
  constructor() {
    super(...arguments);
    this.state = {
      width: this.props.width,
      height: this.props.height,
      propsWidth: this.props.width,
      propsHeight: this.props.height,
    };
    this.onResize = (e, data) => {
      const { size } = data;
      if (this.props.onResize) {
        e.persist && e.persist();
        this.setState(size, () => this.props.onResize && this.props.onResize(e, data));
      } else {
        this.setState(size);
      }
    };
  }

  static getDerivedStateFromProps(props, state) {
    // If parent changes height/width, set that in our state.
    if (state.propsWidth !== props.width || state.propsHeight !== props.height) {
      return {
        width: props.width,
        height: props.height,
        propsWidth: props.width,
        propsHeight: props.height,
      };
    }
    return null;
  }

  render() {
    // Basic wrapper around a Resizable instance.
    // If you use Resizable directly, you are responsible for updating the child component
    // with a new width and height.
    const _a = this.props; const {
      handle, handleSize, onResize, onResizeStart, onResizeStop, draggableOpts, minConstraints, maxConstraints, lockAspectRatio, axis, width, height, resizeHandles,
    } = _a; const
      props = __rest(_a, ['handle', 'handleSize', 'onResize', 'onResizeStart', 'onResizeStop', 'draggableOpts', 'minConstraints', 'maxConstraints', 'lockAspectRatio', 'axis', 'width', 'height', 'resizeHandles']);
    return (React.createElement(Resizable, {
      handle, handleSize, width: this.state.width, height: this.state.height, onResizeStart, onResize: this.onResize, onResizeStop, draggableOpts, minConstraints, maxConstraints, lockAspectRatio, axis, resizeHandles,
    },
    React.createElement('div', { style: { width: `${this.state.width}px`, height: `${this.state.height}px` }, ...props })));
  }
}
ResizableBox.defaultProps = {
  handleSize: [20, 20],
};
