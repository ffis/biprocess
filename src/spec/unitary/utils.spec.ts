import { calculateKey, generator } from "../../utils";

describe("utils", () => {
    it("should be able to calculate keys", () => {
        expect(calculateKey("/a/b/c", {})).toEqual("/a/b/c");
        expect(calculateKey("/a/b/:c", {a: "1"})).toEqual("/a/b/:c");
        expect(calculateKey("/:a/b/:c", {a: "1"})).toEqual("/1/b/:c");
        expect(calculateKey("/:a/b/:c", {a: "1", b: "2"})).toEqual("/1/b/:c");
        expect(calculateKey("/:a/b/:c", {a: "1", c: "3"})).toEqual("/1/b/3");
    });

    it("should work with generator", async () => {
        const obj = {
            fn: () => {
                return Promise.resolve([]);
            }
        }
        await expectAsync(generator(obj.fn, obj, "/:a/:b", {a: "1"}, (params: { [key: string]: any }) => {
            params.b = "2";
        }, (value, newkey) => {
            expect(value).toEqual([]);
            expect(newkey).toEqual("/1/2");
        })()).toBeResolved();
    });

    it("should not fail with generator when function returns a rejected promise", async () => {
        const obj = {
            fn: () => {
                return Promise.reject("error");
            }
        }
        const decorateFn = (params:  { [key: string]: any }) => {
            params.b = "2";
        };
        const afterFn = () => {};

        await expectAsync(generator(obj.fn, obj, "/:a/:b", {a: "1"}, decorateFn, afterFn)()).toBeResolved();
    });
});
