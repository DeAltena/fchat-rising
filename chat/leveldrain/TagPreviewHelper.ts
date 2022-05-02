import {ImagePreviewHelper} from "../preview/helper";

export class TagPreviewHelper extends ImagePreviewHelper {
    static readonly TAG_TESTER = /^tag:\/\/(.+)/;

    hide(): void {
        this.visible = false;
        this.url = undefined;
    }


    getName(): string {
        return 'TagPreviewHelper';
    }


    show(url: string | undefined): void {
        this.visible = true;
        this.url = url;

        if (!url) {
            return;
        }

        const match = url.match(TagPreviewHelper.TAG_TESTER);

        if (!match) {
            return;
        }

        const tagName = match[1];

        this.parent.getTagPreview().load(tagName);
    }


    setRatio(_ratio: number): void {
        // do nothing
    }


    reactsToSizeUpdates(): boolean {
        return false;
    }


    shouldTrackLoading(): boolean {
        return false;
    }


    usesWebView(): boolean {
        return false;
    }


    match(_domainName: string | undefined, url: string | undefined): boolean {
        if (!url) {
            return false;
        }

        return TagPreviewHelper.TAG_TESTER.test(url);
    }


    renderStyle(): Record<string, any> {
        return this.isVisible()
            ? { display: 'block' }
            : { display: 'none' };
    }
}

