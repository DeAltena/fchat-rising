import core from '../core';

export class Format {
    id: string;
    name = 'New Format';
    startTag = '"';
    endTag = '"';
    startReplace = '';
    endReplace = '';
    excludeTags = false;
    bold = false;
    italic = false;
    underscore = false;
    colour = '';

    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

export class AutoFormatter {
    private static instance: AutoFormatter;

    formats: Format[] = [];
    apply = false;

    private constructor() {
        this.formats = core.state.settings.autoFormats;
        this.apply = core.state.settings.applyAutoFormats;
    }

    static getInstance(): AutoFormatter {
        if(!AutoFormatter.instance)
            AutoFormatter.instance = new AutoFormatter();
        return AutoFormatter.instance;
    }

    deepCopyFormats(): Format[] {
        const fs: Format[] = [];
        this.formats.forEach(
            (format) => {
                let f = this.deepCopyFormat(format);
                fs.push(f);
            }
        );
        return fs;
    }

    applyFormats(message: string): string {
        if(!this.apply)
            return message;

        this.formats.forEach(
            (format) => {
                let index;
                let searchFrom = 0;
                while((index = message.indexOf(format.startTag, searchFrom)) !== -1) {
                    if(format.startReplace !== '') {
                        message = format.excludeTags
                            ? [message.slice(0, index), format.startReplace, this.createStartTags(format), message.slice(index + format.startTag.length)].join('')
                            : [message.slice(0, index), this.createStartTags(format), format.startReplace, message.slice(index + format.startTag.length)].join('');

                        searchFrom = index + this.createStartTags(format).length + format.startReplace.length;
                    } else {
                        message = format.excludeTags
                            ? [message.slice(0, index + format.startTag.length), this.createStartTags(format), message.slice(index + format.startTag.length)].join('')
                            : [message.slice(0, index), this.createStartTags(format), message.slice(index)].join('');

                        searchFrom = index + this.createStartTags(format).length + format.startTag.length;
                    }
                    if((index = message.indexOf(format.endTag, searchFrom)) !== -1) {
                        if(format.endReplace !== '') {
                            message = format.excludeTags
                                ? [message.slice(0, index), this.createEndTags(format), format.endReplace, message.slice(index + format.endTag.length)].join('')
                                : [message.slice(0, index), format.endReplace, this.createEndTags(format), message.slice(index + format.endTag.length)].join('');

                            searchFrom = index + this.createEndTags(format).length + format.endReplace.length;
                        } else {
                            message = format.excludeTags
                                ? [message.slice(0, index), this.createEndTags(format), message.slice(index)].join('')
                                : [message.slice(0, index + format.endTag.length), this.createEndTags(format), message.slice(index + format.endTag.length)].join('');

                            searchFrom = index + this.createEndTags(format).length + format.endTag.length;
                        }


                    } else {
                        //Add closing tags if the format-block wasn't properly closed in order to ensure well-formed BBCode
                        message = [message, this.createEndTags(format)].join('');
                        break;
                    }
                }
            }
        );

        return message;
    }

    createStartTags(format: Format): string {
        let ret = '';

        if(format.bold){
            ret += '[b]';
        }
        if(format.italic){
            ret += '[i]';
        }
        if(format.underscore){
            ret += '[u]';
        }
        if(format.colour !== ''){
            ret += `[color=${format.colour}]`;
        }

        return ret;
    }

    createEndTags(format: Format): string {
        let ret = '';

        if(format.colour !== ''){
            ret += `[/color]`;
        }
        if(format.underscore){
            ret += '[/u]';
        }
        if(format.italic){
            ret += '[/i]';
        }
        if(format.bold){
            ret += '[/b]';
        }

        return ret;
    }

    deepCopyFormat(format: Format): Format {
        const f = new Format();
        f.id = format.id;
        f.name = format.name;
        f.startTag = format.startTag;
        f.endTag = format.endTag;
        f.startReplace = format.startReplace;
        f.endReplace = format.endReplace;
        f.excludeTags = format.excludeTags;
        f.bold = format.bold;
        f.italic = format.italic;
        f.underscore = format.underscore;
        f.colour = format.colour;
        return f;
    }
}