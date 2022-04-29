import {ImagePreviewHelper} from "../preview/helper";

export class BuffPreviewHelper extends ImagePreviewHelper {
    static readonly BUFF_TESTER = /^buff:\/\/(.+)/;

    hide(): void {
        this.visible = false;
        this.url = undefined;
    }


    getName(): string {
        return 'BuffPreviewHelper';
    }


    show(url: string | undefined): void {
        this.visible = true;
        this.url = url;

        if (!url) {
            return;
        }

        const match = url.match(BuffPreviewHelper.BUFF_TESTER);

        if (!match) {
            return;
        }

        const buffName = match[1];

        this.parent.getBuffPreview().load(buffName);
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

        return BuffPreviewHelper.BUFF_TESTER.test(url);
    }


    renderStyle(): Record<string, any> {
        return this.isVisible()
            ? { display: 'block' }
            : { display: 'none' };
    }
}

