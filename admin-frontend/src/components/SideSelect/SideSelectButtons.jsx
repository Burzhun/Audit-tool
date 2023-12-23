import React from 'react';
import { Button, ButtonGroup, Segment } from 'semantic-ui-react';
import './SideSelectButtons.scss';

const BUTTON_TYPE = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

function SideSelectButtons(props) {
  const { onClick, disabledLeft, disabledRight } = props;

  return (
    <Segment className="select-buttons">
      <ButtonGroup basic>
        <Button
          className="select-button"
          disabled={disabledLeft}
          onClick={() => onClick(BUTTON_TYPE.LEFT)}
          data-qa="left"
        >
          <i className="angle left icon" />
        </Button>
        <Button
          className="select-button"
          disabled={disabledRight}
          onClick={() => onClick(BUTTON_TYPE.RIGHT)}
          data-qa="right"
        >
          <i className="angle right icon" />
        </Button>
      </ButtonGroup>
    </Segment>
  );
}

export { BUTTON_TYPE };
export default SideSelectButtons;
