import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import DFundCoreABI from "../truffle_abis/DFundCore.json";
import ExpertReviewABI from "../truffle_abis/ExpertReview.json";
import { CONTRACT_ADDRESS } from "../web3/DFundContract";
import { CONTRACT_ADDRESS as REVIEW_CONTRACT_ADDRESS } from "../web3/ExpertReviewContract";

// Pinata
const PINATA_API_KEY = "f238b0f7401c3c3028bb";
const PINATA_SECRET_API_KEY =
  "a0efd638ade333eec0f64aed2411edcbb72e98da5f6b950d5b1ad774879716d5";

export default function RegisterProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expertReviewRequested, setExpertReviewRequested] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [detailImageUrls, setDetailImageUrls] = useState([]);
  const [status, setStatus] = useState("");
  const [rewards, setRewards] = useState([{ name: "", price: "" }]);

  const navigate = useNavigate();

  /*-----------------------------------------
    이미지 핀아타 업로드
  ------------------------------------------*/
  const uploadToPinata = async (file) => {
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await axios.post(url, data, {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      });

      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (err) {
      console.error("Pinata 업로드 실패:", err);
      return "";
    }
  };

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadToPinata(file);
    if (url) setMainImageUrl(url);
  };

  const handleDetailImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];

    for (const file of files) {
      const url = await uploadToPinata(file);
      if (url) urls.push(url);
    }
    setDetailImageUrls(urls);
  };

  /*-----------------------------------------
    프로젝트 등록하기
  ------------------------------------------*/
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.ethereum) {
      alert("Metamask가 필요합니다.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DFundCoreABI.abi,
        signer
      );

      const goalInWei = ethers.utils.parseEther(goalAmount);
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const rewardData = rewards.map((r) => ({
        name: r.name,
        price: ethers.utils.parseEther(r.price || "0"),
      }));

      const tx = await contract.registerProject(
        title,
        description,
        mainImageUrl || "",
        detailImageUrls || [],
        goalInWei,
        startTimestamp,
        endTimestamp,
        deadlineTimestamp,
        expertReviewRequested,
        rewardData
      );

      setStatus("등록 중...");
      await tx.wait();

      const projectCount = await contract.projectCount();
      const project = await contract.projects(projectCount);

      if (expertReviewRequested) {
        const reviewContract = new ethers.Contract(
          REVIEW_CONTRACT_ADDRESS,
          ExpertReviewABI.abi,
          signer
        );
        const enableTx = await reviewContract.enableReview(
          projectCount,
          deadlineTimestamp
        );
        await enableTx.wait();
      }

      if (project && project.title.length > 0) {
        setStatus(`등록 성공! 프로젝트 ID: ${projectCount}`);
        navigate("/projects");
      } else {
        setStatus("등록 확인 실패. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error(error);
      alert("등록 실패. 다시 시도해주세요.");
    }
  };

  /*-----------------------------------------
    UI 렌더링
  ------------------------------------------*/

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#f7fbff] py-20 px-4">
      {/* 박스 전체 */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-[#e8eaf3] p-10">

        <h2 className="text-3xl font-bold text-[#1e3a8a] mb-10">
          프로젝트 등록
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 제목 */}
          <div>
            <label className="block font-semibold mb-2">프로젝트 제목</label>
            <input
              type="text"
              className="w-full border border-[#cbd5e1] rounded-xl p-3 focus:ring-2 focus:ring-blue-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 설명 (Quill) */}
          <div>
            <label className="block font-semibold mb-3">프로젝트 설명</label>
            <ReactQuill theme="snow" value={description} onChange={setDescription} />
          </div>

          {/* 대표 이미지 */}
          <div>
            <label className="block font-semibold mb-2">대표 이미지</label>
            <input
              type="file"
              className="w-full"
              accept="image/*"
              onChange={handleMainImageChange}
            />
            {mainImageUrl && (
              <img
                src={mainImageUrl}
                className="w-full rounded-xl mt-3 shadow-md"
                alt="preview"
              />
            )}
          </div>

          {/* 상세 이미지 */}
          <div>
            <label className="block font-semibold mb-2">상세 이미지</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full"
              onChange={handleDetailImagesChange}
            />

            <div className="flex gap-3 flex-wrap mt-3">
              {detailImageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="detail"
                  className="w-32 h-32 object-cover rounded-xl shadow"
                />
              ))}
            </div>
          </div>

          {/* 목표 금액 & 후원 마감 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div>
              <label className="block font-semibold mb-2">목표 금액 (ETH)</label>
              <input
                type="number"
                className="w-full border border-[#cbd5e1] rounded-xl p-3"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">후원 마감일</label>
              <input
                type="datetime-local"
                className="w-full border border-[#cbd5e1] rounded-xl p-3"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 시작일 & 종료일 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block font-semibold mb-2">프로젝트 시작일</label>
              <input
                type="datetime-local"
                className="w-full border border-[#cbd5e1] rounded-xl p-3"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">프로젝트 마감일</label>
              <input
                type="datetime-local"
                className="w-full border border-[#cbd5e1] rounded-xl p-3"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 리워드 목록 */}
          <div>
            <label className="block font-semibold mb-2">리워드 목록</label>

            {rewards.map((reward, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  placeholder="리워드 이름"
                  className="border border-[#cbd5e1] rounded-xl p-3"
                  value={reward.name}
                  onChange={(e) => {
                    const updated = [...rewards];
                    updated[index].name = e.target.value;
                    setRewards(updated);
                  }}
                />
                <input
                  type="number"
                  placeholder="금액 (ETH)"
                  className="border border-[#cbd5e1] rounded-xl p-3"
                  value={reward.price}
                  onChange={(e) => {
                    const updated = [...rewards];
                    updated[index].price = e.target.value;
                    setRewards(updated);
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => setRewards([...rewards, { name: "", price: "" }])}
              type="button"
              className="px-4 py-2 bg-[#e5e7eb] rounded-xl mt-2"
            >
              + 리워드 추가
            </button>
          </div>

          {/* 전문가 심사 요청 */}
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={expertReviewRequested}
              onChange={() =>
                setExpertReviewRequested(!expertReviewRequested)
              }
            />
            <span className="text-sm">전문가 심사 요청</span>
          </div>

          {/* 버튼 */}
          <button
            type="submit"
            className="w-full bg-[#2563eb] text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-[#1d4ed8] transition"
          >
            등록하기
          </button>

          {status && (
            <p className="text-center text-gray-700 mt-4 font-medium">
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}