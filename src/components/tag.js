import React from 'react';
import  './tag.css'
import {Typography, Paragraph} from "@contentful/forma-36-react-components";

const Tag = props => {
  return (
      <div className={props.primary ? "tag primary" : "tag"} onClick={props.onClick}>
        <Typography><Paragraph style={{color:'white'}}>{props.children}</Paragraph></Typography>
      </div>
  );
};


export default Tag;
