import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TextInput , Pill} from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import Tag from './components/tag'

class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  detachExternalChangeHandler = null;

  constructor(props) {
    super(props);
    this.sdk = this.props.sdk;
    this.state = {
      tags: [],
      inputValue: '',
      value: [],
      suggestedTags: []
    };

    this.inputRef = React.createRef()

  }

  componentDidMount() {
    this.sdk.window.startAutoResizer();
    let tags = this.getTags()
    tags.then( tags => {
      this.setState({tags: tags})
    })
    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(
      this.onExternalChange
    );

    this.inputRef.current.addEventListener('keydown', this.onInputKeyDown);
  }

  componentWillUnmount() {
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
    this.inputRef.current.removeEventListener('keydown', this.onInputKeyDown);

  }

  onExternalChange = value => {
    this.setState({ value });
  };


  onInputChange = e => {
    const value = e.currentTarget.value
    this.setState({ inputValue: value })


    if (value == ''){
      this.setState({suggestedTags: []})
    } else{
      const matcher = new RegExp('^' + value);
      let candidates = this.state.tags.filter(tag => {
        return matcher.test(tag) && this.state.value.indexOf(tag) === -1;
      })

      this.setState({suggestedTags: candidates})
    }
  }

  onInputKeyDown = e => {
    const key = event.which || event.keyCode;
    if ((key === 39 || key === 9) && this.state.suggestedTags.length) { // 39 is right arrow, 9 is tab
      event.preventDefault();
      this.setState({inputValue: this.state.suggestedTags[0]})
    }

    if (key === 13  && this.state.inputValue.length){
      if(this.sdk.parameters.instance.allowAdd || this.state.tags.indexOf(this.state.inputValue) > -1 ) {
        this.addTag(this.state.inputValue)
      } else{
        this.setState({inputValue: this.state.suggestedTags[0]})
      }
    }
  }

  resetInput = () => {
    this.setState({
      inputValue: '',
      suggestedTags: []
    })
    this.inputRef.current.focus()

  }

  addTag = tagVal => {
    let newTags = this.state.value.slice(0)
    newTags.push(tagVal)
    this.props.sdk.field.setValue(newTags);
    this.resetInput()
  }

  removeTag = tagVal => {
    let newTags = this.state.value.slice(0)
    let idx = newTags.indexOf(tagVal)
    if (idx > -1){
      newTags.splice(idx, 1)
    }
    this.props.sdk.field.setValue(newTags);
  }

  getTags = () => {
    return new Promise((resolve, reject) =>{
      const searchField = this.sdk.parameters.instance.fieldName || 'tags'
      const field = this.sdk.field

      // Get all entries and find field that matches
      this.sdk.space.getEntries().then(entries => {
        let tags = [];
        entries.items.forEach(item => {
          if (item.fields.hasOwnProperty(searchField) && item.fields[searchField].hasOwnProperty(field.locale) && item.fields[searchField][field.locale].forEach ) {
            item.fields[searchField][field.locale].forEach(function(tag) {
              if ( tags.indexOf(tag) == -1 ){
                tags.push(tag)
              }
            });
          }
        })
        resolve(tags);
      }).catch(() => reject() );

    });
  }

  render() {
    return (
        <div>
          <TextInput
            width="large"
            type="text"
            id="my-field"
            autoComplete="off"
            value={this.state.inputValue}
            onChange={this.onInputChange}
            inputRef={this.inputRef}
          />

          <div>
          {this.state.suggestedTags && this.state.suggestedTags.map((tag, i) => (
              <Tag onClick={() => this.addTag(tag)} key={tag} primary={i === 0}>{tag}</Tag>
          ))}
          </div>
          {this.state.value && this.state.value.map((tag) => (
            <div key={tag}  className="pillContainer">
             <Pill onClose={() => this.removeTag(tag)} label={tag} />
            </div>
          ))}

        </div>
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
