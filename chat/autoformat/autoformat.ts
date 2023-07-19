import core from '../core';
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import log from 'electron-log';

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
  conversationOverrides = new Map<string, string>();

  private constructor() {
    this.formats = core.state.settings.autoFormats;
    this.apply = core.state.settings.applyAutoFormats;
    const formatString = core.state.settings.conversationOverrideFormats;
    if(formatString && formatString.trim() !== '') {
      const overrideJson = JSON.parse(core.state.settings.conversationOverrideFormats);
      Object.keys(overrideJson).forEach((key) => {
        this.conversationOverrides.set(key, overrideJson[key]);
      });
    }
  }

  static getInstance(): AutoFormatter {
    if (!AutoFormatter.instance)
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

  async storeConversationOverrides(): Promise<void> {
    const overrideObj: { [key: string]: string } = {};
    this.conversationOverrides.forEach((value, key) => {
      overrideObj[key] = value;
    });
    core.state.settings = {
      playSound: core.state.settings.playSound,
      clickOpensMessage: core.state.settings.clickOpensMessage,
      disallowedTags: core.state.settings.disallowedTags,
      notifications: core.state.settings.notifications,
      highlight: core.state.settings.highlight,
      highlightWords: core.state.settings.highlightWords,
      showAvatars: core.state.settings.showAvatars,
      animatedEicons: core.state.settings.animatedEicons,
      idleTimer: core.state.settings.idleTimer,
      messageSeparators: core.state.settings.messageSeparators,
      eventMessages: core.state.settings.eventMessages,
      joinMessages: core.state.settings.joinMessages,
      alwaysNotify: core.state.settings.alwaysNotify,
      logMessages: core.state.settings.logMessages,
      logAds: core.state.settings.logAds,
      fontSize: core.state.settings.fontSize,
      showNeedsReply: core.state.settings.showNeedsReply,
      enterSend: core.state.settings.enterSend,
      colorBookmarks: core.state.settings.colorBookmarks,
      bbCodeBar: core.state.settings.bbCodeBar,
      risingAdScore: core.state.settings.risingAdScore,
      risingLinkPreview: core.state.settings.risingLinkPreview,
      risingAutoCompareKinks: core.state.settings.risingAutoCompareKinks,
      risingAutoExpandCustomKinks: core.state.settings.risingAutoExpandCustomKinks,
      risingCharacterPreview: core.state.settings.risingCharacterPreview,
      risingComparisonInUserMenu: core.state.settings.risingComparisonInUserMenu,
      risingComparisonInSearch: core.state.settings.risingComparisonInSearch,
      risingShowUnreadOfflineCount: core.state.settings.risingShowUnreadOfflineCount,
      risingShowPortraitNearInput: core.state.settings.risingShowPortraitNearInput,
      risingShowPortraitInMessage: core.state.settings.risingShowPortraitInMessage,
      risingColorblindMode: core.state.settings.risingColorblindMode,
      risingFilter: core.state.settings.risingFilter,
      autoFormats: core.state.settings.autoFormats,
      applyAutoFormats: core.state.settings.applyAutoFormats,
      conversationOverrideFormats: JSON.stringify(overrideObj)
    };

    if(core.state.settings.notifications) await core.notifications.requestPermission();
  }

  addConversationOverride(conv: string, color: string): void {
    this.conversationOverrides.set(conv, color);
    this.storeConversationOverrides();
  }

  removeConversationOverride(conv: string): void {
    this.conversationOverrides.delete(conv);
    this.storeConversationOverrides();
  }

  getConversationOverride(conv: string): string | undefined {
    return this.conversationOverrides.get(conv);
  }

  applyFormat(message: string, format: Format): string {
    let index;
    let searchFrom = 0;
    while ((index = message.indexOf(format.startTag, searchFrom)) !== -1) {
      if (format.startReplace !== '') {
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
      if ((index = message.indexOf(format.endTag, searchFrom)) !== -1) {
        if (format.endReplace !== '') {
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

    return message;
  }

  applyFormats(message: string, conversation: string): string {
    if (!this.apply)
      return message;

    const overrideColor = this.conversationOverrides.get(conversation);
    let overrideFormat = new Format();

    this.formats.forEach(
      (format) => {
        if(overrideColor !== undefined && (format.startTag  === '"' && format.endTag === '"')){
          overrideFormat = this.deepCopyFormat(format);
          return;
        }
        message = this.applyFormat(message, format);
      }
    );

    if(overrideColor !== undefined) {
      overrideFormat.colour = overrideColor;
      message = this.applyFormat(message, overrideFormat);
    }

    return message;
  }

  createStartTags(format: Format): string {
    let ret = '';

    if (format.bold) {
      ret += '[b]';
    }
    if (format.italic) {
      ret += '[i]';
    }
    if (format.underscore) {
      ret += '[u]';
    }
    if (format.colour !== '') {
      ret += `[color=${format.colour}]`;
    }

    return ret;
  }

  createEndTags(format: Format): string {
    let ret = '';

    if (format.colour !== '') {
      ret += `[/color]`;
    }
    if (format.underscore) {
      ret += '[/u]';
    }
    if (format.italic) {
      ret += '[/i]';
    }
    if (format.bold) {
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