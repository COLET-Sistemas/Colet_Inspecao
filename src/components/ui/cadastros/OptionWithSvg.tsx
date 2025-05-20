import { memo } from 'react';

interface OptionWithSvgProps {
    descricao: string;
    simbolo_path_svg?: string;
}

export const OptionWithSvg = memo(({ descricao, simbolo_path_svg }: OptionWithSvgProps) => {
    return (
        <div className="flex items-center gap-2">
            {simbolo_path_svg && (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 100 100"
                    className="inline-block"
                    dangerouslySetInnerHTML={{ __html: simbolo_path_svg }}
                />
            )}
            <span>{descricao}</span>
        </div>
    );
});

OptionWithSvg.displayName = 'OptionWithSvg';
