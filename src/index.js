import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { init } from 'contentful-ui-extensions-sdk';
import { CheckboxField, FieldGroup, HelpText } from '@contentful/forma-36-react-components';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';


class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  detachExternalChangeHandler = null;

  constructor(props) {
    super(props);
    this.sdk = this.props.sdk;
    this.state = {
      suggestedTags: [],
      selectedTagIDs: [],
    };

    const categoryID = this.sdk.parameters.instance.categoryFieldName || 'category';

    this.categoryField = this.sdk.entry.fields[categoryID];
  }

  componentDidMount() {
    this.sdk.window.startAutoResizer();
    this.detachCategoryChangeHandler = this.categoryField.onValueChanged(this.onCategoryChanged)

    const intialValue = this.sdk.field.getValue();
    if (intialValue) {
      this.setState({selectedTagIDs: intialValue.map( item => item.sys.id )})
    }

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(
      this.onExternalChange
    );

  }

  componentWillUnmount() {
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
    if (this.detachCategoryChangeHandler) {
      this.detachCategoryChangeHandler();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    //gonna assume react is faster than a user at clicking checkboxes
    if (prevState.selectedTagIDs.length !== this.state.selectedTagIDs.length) {

      this.props.sdk.field.setValue(
        this.state.selectedTagIDs.map(tagID => {
          return {
            sys: {
              type: "Link",
              linkType: "Entry",
              id: tagID,
            }
          }
        }
      ));
    }
  }

  onExternalChange = value => {
    if (value) {
      this.setState({selectedTagIDs: value.map( item => item.sys.id )})
    } else{
      this.setState({selectedTagIDs: []})
    }
  };

  onCategoryChanged = async value => {
    // If a category is set
    if(this.categoryField.getValue()){
      const categoryID = this.categoryField.getValue().sys.id;

      // get the new category from the link id
      const category = await this.sdk.space.getEntry(categoryID);
      const tagIDs = category.fields.tags['en-US'].map(tag => tag.sys.id);

      // Get tags that are linked to those categories
      const tags = await this.sdk.space.getEntries({
        content_type: 'tag',
        'sys.id[in]': tagIDs.join(',')
      });

      this.setState({'suggestedTags': tags.items})
    }

    else{
      this.setState({
        'suggestedTags': [],
        selectedTagIDs: []
      })
    }

  }


  onInputChange = e => {
    const value = e.currentTarget.value

    if (this.state.selectedTagIDs.indexOf(value) > -1){
      this.setState({selectedTagIDs: this.state.selectedTagIDs.filter(id => id !== value )})
    } else{
      this.setState({selectedTagIDs: [...this.state.selectedTagIDs, value]})
    }

  }

  render() {
    return (

        this.state.suggestedTags.length ?
          <FieldGroup>
            {this.state.suggestedTags.map(tag => (
                <CheckboxField
                    onChange={this.onInputChange}
                    key={tag.sys.id}
                    name={tag.fields.title['en-US']}
                    value={tag.sys.id}
                    labelText={tag.fields.title['en-US']}
                    id={tag.sys.id}
                    checked={this.state.selectedTagIDs.indexOf(tag.sys.id) > -1}
                />
            ))}
          </FieldGroup> :
          <HelpText>Waiting for category....</HelpText>
    );
  }
}

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});

// Enabling hot reload
if (module.hot) {
  module.hot.accept();
}
