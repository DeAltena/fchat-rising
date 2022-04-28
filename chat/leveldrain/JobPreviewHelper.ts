import {ImagePreviewHelper} from "../preview/helper";

export class JobPreviewHelper extends ImagePreviewHelper {
    static readonly JOB_TESTER = /^job:\/\/(.+)/;

    hide(): void {
        this.visible = false;
        this.url = undefined;
    }


    getName(): string {
        return 'JobPreviewHelper';
    }


    show(url: string | undefined): void {
        this.visible = true;
        this.url = url;

        if (!url) {
            return;
        }

        const match = url.match(JobPreviewHelper.JOB_TESTER);

        if (!match) {
            return;
        }

        const jobName = match[1];

        this.parent.getJobPreview().load(jobName);
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

        return JobPreviewHelper.JOB_TESTER.test(url);
    }


    renderStyle(): Record<string, any> {
        return this.isVisible()
            ? { display: 'block' }
            : { display: 'none' };
    }
}

