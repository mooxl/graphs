import { verbose } from "./main.ts";

export function measureTime() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original: (...args: Array<unknown>) => unknown = descriptor.value;

    const timeLabel: string = `${target.constructor.name}.${propertyKey}`;
    descriptor.value = function (...args: Array<unknown>) {
      verbose && console.time(timeLabel);
      const value: unknown = original.apply(this, args);
      verbose && console.timeEnd(timeLabel);

      return value;
    };
  };
}
