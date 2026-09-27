import React from 'react';

export default function Input({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-[#111111] dark:text-[#F5F5F5] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[#929292] dark:text-[#707070]">
            <LeftIcon className="w-4 h-4 stroke-[1.75px]" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`w-full h-[40px] bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[9px] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] transition-colors duration-150 focus:outline-none focus:border-[#FF5C35] dark:focus:border-[#FF6845] focus:ring-1 focus:ring-[#FF5C35]/30 dark:focus:ring-[#FF6845]/30 ${
            LeftIcon ? 'pl-9' : 'px-3.5'
          } ${RightIcon ? 'pr-9' : 'px-3.5'} ${
            error
              ? 'border-[#D64545] dark:border-[#E05252] focus:border-[#D64545] focus:ring-[#D64545]/20'
              : ''
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-[#929292] dark:text-[#707070]">
            <RightIcon className="w-4 h-4 stroke-[1.75px]" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-[#D64545] dark:text-[#E05252] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
