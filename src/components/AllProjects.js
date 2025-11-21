// AllProjects.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

import DFundCore from "../truffle_abis/DFundCore.json";

const networkId = window.ethereum?.networkVersion || "5777";
const CONTRACT_ADDRESS = DFundCore.networks[networkId]?.address;

if (!CONTRACT_ADDRESS) {
  console.warn(
    `⚠️ DFundCore가 네트워크 ${networkId}에 배포되어 있지 않습니다. 
  truffle migrate --reset 후 build/contracts/DFundCore.json을 다시 복사하세요.`
  );
}

function AllProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("로딩 중...");

  useEffect(() => {
    const loadProjects = async () => {
      if (!window.ethereum) {
        setStatus("Metamask가 설치되어 있지 않습니다.");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DFundCore.abi,
          provider
        );

        console.log("🌐 Network:", await provider.getNetwork());
        console.log("📍 Contract Address:", CONTRACT_ADDRESS);
        console.log(
          "📄 ABI contains getAllProjects:",
          DFundCore.abi.some((f) => f.name === "getAllProjects")
        );

        const allProjects = await contract.getAllProjects();

        const loadedProjects = allProjects
          .filter((p) => p.id.toNumber() !== 0 && p.title !== "")
          .map((p) => ({
            id: p.id.toString(),
            creator: p.creator,
            title: p.title,
            description: p.description,
            image: p.image,
            goalAmount: ethers.utils.formatEther(p.goalAmount),
            deadline: p.deadline.toNumber(),
            statusCode: p.status,
          }));

        const fundedAmounts = await Promise.all(
          loadedProjects.map(async (p) => {
            const balance = await contract.getTotalDonated(p.id);
            return ethers.utils.formatEther(balance);
          })
        );

        const merged = loadedProjects.map((p, i) => ({
          ...p,
          fundedAmount: fundedAmounts[i],
        }));

        setProjects(merged);
        setStatus(
          merged.length === 0 ? "등록된 프로젝트가 아직 없습니다." : ""
        );
      } catch (err) {
        console.error("❌ 프로젝트 불러오기 실패:", err);
        setStatus("프로젝트 목록을 불러오는 데 실패했습니다.");
      }
    };

    loadProjects();
  }, []);

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline * 1000 - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일 남음` : "마감";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#f7fbff] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-[#2563eb]">
            전체 등록된 프로젝트
          </h2>
          <p className="text-[#6d6d80] mt-2">
            D-Fund 커뮤니티에서 진행 중인 모든 프로젝트를 확인해보세요.
          </p>
        </div>

        {status && (
          <p className="text-[#6d6d80] mb-8">
            {status}
          </p>
        )}

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => {
            const percent = Math.min(
              Math.floor(
                (parseFloat(project.fundedAmount || 0) /
                  parseFloat(project.goalAmount || 1)) *
                  100
              ),
              100
            );

            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="
                  block rounded-3xl bg-white border border-[#e5e8ef]
                  shadow-md hover:shadow-xl 
                  overflow-hidden transform hover:-translate-y-1
                  transition-all duration-200
                "
              >
                {/* 이미지 영역 */}
                <div className="w-full h-44 bg-[#f3f4f6] overflow-hidden">
                  {project.image && (
                    <img
                      src={project.image}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* 내용 영역 */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#111827] line-clamp-2">
                    {project.title}
                  </h3>

                  {/* 진행률 */}
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-[#2563eb] font-semibold">
                      {percent}% 달성
                    </span>
                    <span className="text-[#6b7280]">
                      {Number(project.fundedAmount).toFixed(2)} /{" "}
                      {Number(project.goalAmount).toFixed(2)} ETH
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#dbe4ff] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563eb]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* 남은 일수 */}
                  <div className="mt-3 text-sm text-[#6b7280]">
                    {calculateDaysLeft(project.deadline)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AllProjects;
