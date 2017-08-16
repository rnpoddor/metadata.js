/** @flow */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import {AutoSizer, List} from 'react-virtualized';


export default class VirtualizedSelect extends Component {

  static propTypes = {
    async: PropTypes.bool,
    listProps: PropTypes.object,
    maxHeight: PropTypes.number.isRequired,
    optionHeight: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.number,
    ]).isRequired,
    optionRenderer: PropTypes.func,
    selectComponent: PropTypes.func,
  };

  static defaultProps = {
    async: false,
    maxHeight: 200,
    optionHeight: 35,
  };

  /** See List#recomputeRowHeights */
  recomputeOptionHeights(index = 0) {
    if (this._virtualScroll) {
      this._virtualScroll.recomputeRowHeights(index);
    }
  }

  render() {
    const SelectComponent = this._getSelectComponent();

    return (
      <SelectComponent
        {...this.props}
        menuRenderer={this._renderMenu}
        menuStyle={{overflow: 'hidden'}}
      />
    );
  }

  // See https://github.com/JedWatson/react-select/#effeciently-rendering-large-lists-with-windowing
  _renderMenu = ({focusedOption, focusOption, labelKey, onSelect, options, valueArray}) => {
    const {listProps, optionRenderer} = this.props;
    const focusedOptionIndex = options.indexOf(focusedOption);
    const height = this._calculateListHeight({options});
    const innerRowRenderer = optionRenderer || this._optionRenderer;

    // react-select 1.0.0-rc2 passes duplicate `onSelect` and `selectValue` props to `menuRenderer`
    // The `Creatable` HOC only overrides `onSelect` which breaks an edge-case
    // In order to support creating items via clicking on the placeholder option,
    // We need to ensure that the specified `onSelect` handle is the one we use.
    // See issue #33

    function wrappedRowRenderer({index, key, style}) {
      const option = options[index];

      return innerRowRenderer({
        focusedOption,
        focusedOptionIndex,
        focusOption,
        key,
        labelKey,
        onSelect,
        option,
        optionIndex: index,
        options,
        selectValue: onSelect,
        style,
        valueArray,
      });
    }

    return (
      <AutoSizer disableHeight>
        {({width}) => (
          <List
            className='VirtualSelectGrid'
            height={height}
            ref={(ref) => this._virtualScroll = ref}
            rowCount={options.length}
            rowHeight={({index}) => this._getOptionHeight({
              option: options[index],
            })}
            rowRenderer={wrappedRowRenderer}
            scrollToIndex={focusedOptionIndex}
            width={width}
            {...listProps}
          />
        )}
      </AutoSizer>
    );
  };

  _calculateListHeight({options}) {
    const {maxHeight} = this.props;

    let height = 0;

    for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
      let option = options[optionIndex];

      height += this._getOptionHeight({option});

      if (height > maxHeight) {
        return maxHeight;
      }
    }

    return height;
  }

  _getOptionHeight({option}) {
    const {optionHeight} = this.props;

    return optionHeight instanceof Function
      ? optionHeight({option})
      : optionHeight;
  }

  _getSelectComponent() {
    const {async, selectComponent} = this.props;

    if (selectComponent) {
      return selectComponent;
    } else if (async) {
      return Select.Async;
    } else {
      return Select;
    }
  }

  _optionRenderer = ({focusedOption, focusOption, key, labelKey, option, selectValue, style}) => {
    const className = ['VirtualizedSelectOption'];

    if (option === focusedOption) {
      className.push('VirtualizedSelectFocusedOption');
    }

    if (option.disabled) {
      className.push('VirtualizedSelectDisabledOption');
    }

    const events = option.disabled
      ? {}
      : {
        onClick: () => selectValue(option),
        onMouseOver: () => focusOption(option),
      };

    return (
      <div
        className={className.join(' ')}
        key={key}
        style={style}
        {...events}
      >
        {option[labelKey]}
      </div>
    );
  };
}
