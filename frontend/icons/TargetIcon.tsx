import { SVGProps } from "react";

export const TargetIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            focusable="false"
            height="1em"
            role="presentation"
            viewBox="0 0 20 20"
            width="1em"
            {...props}
        >
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={1.5} />
            <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth={1.5} />
            <circle cx="10" cy="10" r="1.25" fill="currentColor" />
        </svg>
    );
};
