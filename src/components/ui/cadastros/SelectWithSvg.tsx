import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Fragment } from 'react';

export interface Option {
    id: number;
    descricao: string;
    simbolo_path_svg: string;
}

interface SelectWithSvgProps {
    options: Option[];
    value: Option | null;
    onChange: (value: Option) => void;
    placeholder?: string;
    isLoading?: boolean;
    label?: string;
    id?: string;
    required?: boolean;
    className?: string;
}

export function SelectWithSvg({
    options,
    value,
    onChange,
    placeholder = 'Selecione uma opção',
    isLoading = false,
    label,
    id,
    required = false,
    className = ''
}: SelectWithSvgProps) {
    return (
        <Listbox value={value} onChange={onChange}>
            {({ open }) => (
                <>
                    {label && (
                        <Listbox.Label className="text-sm font-medium text-gray-700">
                            {label} {required && <span className="text-red-500">*</span>}
                        </Listbox.Label>
                    )}
                    <div className={`relative mt-1 ${className}`}>
                        <Listbox.Button
                            id={id}
                            className={`relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-left focus:border-[#09A08D] focus:outline-none focus:ring-2 focus:ring-[#09A08D]/30 sm:text-sm ${open ? 'rounded-b-none border-b-0' : ''}`}
                        >
                            <span className="flex items-center gap-2">
                                {value ? (
                                    <>
                                        {value.simbolo_path_svg && (
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 100 100"
                                                className="inline-block"
                                                dangerouslySetInnerHTML={{ __html: value.simbolo_path_svg }}
                                            />
                                        )}
                                        <span className="block truncate">{value.descricao}</span>
                                    </>
                                ) : (
                                    <span className="block truncate text-gray-500">{placeholder}</span>
                                )}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">                                <ChevronsUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute z-10 mt-0 max-h-60 w-full overflow-auto rounded-b-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {isLoading ? (
                                    <div className="relative cursor-default select-none px-4 py-2 text-gray-500">
                                        Carregando...
                                    </div>
                                ) : (
                                    options.map((option) => (
                                        <Listbox.Option
                                            key={option.id}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-[#09A08D] text-white' : 'text-gray-900'
                                                }`
                                            }
                                            value={option}
                                        >
                                            {({ active, selected }) => (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        {option.simbolo_path_svg && (
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 100 100"
                                                                className="inline-block"
                                                                dangerouslySetInnerHTML={{ __html: option.simbolo_path_svg }}
                                                            />
                                                        )}
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {option.descricao}
                                                        </span>
                                                    </div>

                                                    {selected && (
                                                        <span
                                                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-[#09A08D]'}`}
                                                        >
                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </Listbox.Option>
                                    ))
                                )}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </>
            )}
        </Listbox>
    )
}
