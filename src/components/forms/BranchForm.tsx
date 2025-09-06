"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  branchSchema,
  BranchSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createBranch,
  updateBranch,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const BranchForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BranchSchema>({
    resolver: zodResolver(branchSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createBranch : updateBranch,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Branch has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new branch" : "Update the branch"}
      </h1>
      
      <span className="text-xs text-gray-400 font-medium">
        Basic Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Short Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("shortName")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Main Branch"
            defaultValue={data?.shortName}
          />
          {errors?.shortName?.message && (
            <p className="text-xs text-red-400">{errors.shortName.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Legal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("legalName")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Main Educational Center LLC"
            defaultValue={data?.legalName}
          />
          {errors?.legalName?.message && (
            <p className="text-xs text-red-400">{errors.legalName.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            STIR (INN) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("stir")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="123456789"
            defaultValue={data?.stir}
          />
          {errors?.stir?.message && (
            <p className="text-xs text-red-400">{errors.stir.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Phone Number (Call Center) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register("phone")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="+998901234567"
            defaultValue={data?.phone}
          />
          {errors?.phone?.message && (
            <p className="text-xs text-red-400">{errors.phone.message.toString()}</p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Location Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Region <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("region")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Tashkent"
            defaultValue={data?.region}
          />
          {errors?.region?.message && (
            <p className="text-xs text-red-400">{errors.region.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            District (City) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("district")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Chilanzar"
            defaultValue={data?.district}
          />
          {errors?.district?.message && (
            <p className="text-xs text-red-400">{errors.district.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("address")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Chilanzar 9, Building 12"
            defaultValue={data?.address}
          />
          {errors?.address?.message && (
            <p className="text-xs text-red-400">{errors.address.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Longitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            {...register("longitude")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="69.2401"
            defaultValue={data?.longitude}
          />
          {errors?.longitude?.message && (
            <p className="text-xs text-red-400">{errors.longitude.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Latitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            {...register("latitude")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="41.2995"
            defaultValue={data?.latitude}
          />
          {errors?.latitude?.message && (
            <p className="text-xs text-red-400">{errors.latitude.message.toString()}</p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Contact & Status Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Website"
          name="website"
          type="url"
          defaultValue={data?.website}
          register={register}
          error={errors?.website}
          inputProps={{ placeholder: "https://example.com" }}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{ placeholder: "branch@school.uz" }}
        />
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            {...register("status")}
            defaultValue={data?.status || "ACTIVE"}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">
              {errors.status.message.toString()}
            </p>
          )}
        </div>

        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Director Information (Read Only)
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Director Full Name</label>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100"
            value={data?.director ? `${data.director.firstName} ${data.director.lastName}` : "No Director Assigned"}
            readOnly
          />
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">
          {state.message || "Something went wrong!"}
        </span>
      )}
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default BranchForm;
